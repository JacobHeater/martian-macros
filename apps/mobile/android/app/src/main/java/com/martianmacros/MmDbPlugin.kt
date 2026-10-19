package com.martianmacros

import android.util.Base64
import androidx.sqlite.SQLiteConnection
import androidx.sqlite.SQLiteStatement
import androidx.sqlite.driver.bundled.BundledSQLiteDriver
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/** The largest whole number JavaScript holds exactly. */
private const val MAX_EXACT = 9007199254740991L

// SQLite's own open flags (sqlite3.h).
private const val OPEN_READONLY = 0x1
private const val OPEN_READWRITE = 0x2
private const val OPEN_CREATE = 0x4

/**
 * SQLite on the phone's own storage (MM-231), behind the same contract as
 * the WebAssembly build the browser and the tests use. Each open database
 * is one connection whose calls run in order on one thread, so the
 * TypeScript adapter's transactions hold.
 */
@CapacitorPlugin(name = "MmDb")
class MmDbPlugin : Plugin() {

    private class OpenDb(val connection: SQLiteConnection, val executor: ExecutorService)

    private val driver = BundledSQLiteDriver()
    private val open = ConcurrentHashMap<Int, OpenDb>()
    private val nextHandle = AtomicInteger(1)

    @PluginMethod
    fun open(call: PluginCall) {
        val name = call.getString("name")
        val path = call.getString("path")
        val readOnly = call.getBoolean("readOnly") ?: false
        val file = when {
            name != null -> context.getDatabasePath(name).also { it.parentFile?.mkdirs() }
            path != null -> File(path)
            else -> return call.reject("open needs a name or a path.")
        }
        val executor = Executors.newSingleThreadExecutor()
        executor.execute {
            try {
                val flags = if (readOnly) OPEN_READONLY else OPEN_READWRITE or OPEN_CREATE
                val connection = driver.open(file.path, flags)
                try {
                    // A file that is not a database is only found out when it is read.
                    connection.prepare("SELECT count(*) FROM sqlite_schema").used { it.step() }
                } catch (error: Throwable) {
                    connection.close()
                    throw error
                }
                val handle = nextHandle.getAndIncrement()
                open[handle] = OpenDb(connection, executor)
                call.resolve(JSObject().put("db", handle))
            } catch (error: Throwable) {
                executor.shutdown()
                call.reject(error.message ?: error.toString())
            }
        }
    }

    /** Runs `step` on the database's own thread, after every call made before it. */
    private fun queued(call: PluginCall, step: (SQLiteConnection) -> Unit) {
        val db = open[call.getInt("db") ?: -1] ?: return call.reject("The database is closed.")
        db.executor.execute {
            try {
                step(db.connection)
            } catch (error: Throwable) {
                call.reject(error.message ?: error.toString())
            }
        }
    }

    @PluginMethod
    fun select(call: PluginCall) = queued(call) { connection ->
        val rows = JSArray()
        prepared(connection, call).used { statement ->
            val columns = statement.getColumnCount()
            while (statement.step()) {
                val row = JSObject()
                for (column in 0 until columns) {
                    row.put(statement.getColumnName(column), valueAt(statement, column))
                }
                rows.put(row)
            }
        }
        call.resolve(JSObject().put("rows", rows))
    }

    @PluginMethod
    fun execute(call: PluginCall) = queued(call) { connection ->
        prepared(connection, call).used { statement ->
            while (statement.step()) {
                // A statement that gives no rows is still stepped to its end.
            }
        }
        call.resolve()
    }

    @PluginMethod
    fun executeScript(call: PluginCall) = queued(call) { connection ->
        for (statement in statementsOf(call.getString("sql") ?: "")) {
            connection.prepare(statement).used {
                while (it.step()) {
                    // As above.
                }
            }
        }
        call.resolve()
    }

    @PluginMethod
    fun close(call: PluginCall) {
        val db = open.remove(call.getInt("db") ?: -1) ?: return call.reject("The database is closed.")
        db.executor.execute {
            try {
                db.connection.close()
                call.resolve()
            } catch (error: Throwable) {
                call.reject(error.message ?: error.toString())
            } finally {
                db.executor.shutdown()
            }
        }
    }

    private fun prepared(connection: SQLiteConnection, call: PluginCall): SQLiteStatement {
        val statement = connection.prepare(call.getString("sql") ?: "")
        try {
            bind(statement, call.getArray("params") ?: JSArray())
        } catch (error: Throwable) {
            statement.close()
            throw error
        }
        return statement
    }

    private fun bind(statement: SQLiteStatement, params: JSArray) {
        for (index in 0 until params.length()) {
            val at = index + 1
            when (val value = params.get(index)) {
                null, JSONObject.NULL -> statement.bindNull(at)
                is String -> statement.bindText(at, value)
                is Int -> statement.bindLong(at, value.toLong())
                is Long -> statement.bindLong(at, value)
                is Double -> statement.bindDouble(at, value)
                // A blob crosses the bridge as { $blob: base64 }.
                is JSONObject -> statement.bindBlob(at, Base64.decode(value.getString("\$blob"), Base64.DEFAULT))
                else -> throw IllegalArgumentException("Cannot bind a ${value.javaClass.simpleName}.")
            }
        }
    }

    private fun valueAt(statement: SQLiteStatement, column: Int): Any =
        when (statement.getColumnType(column)) {
            // SQLite's own column type codes: INTEGER, FLOAT, TEXT, BLOB, NULL.
            1 -> {
                val number = statement.getLong(column)
                if (number > MAX_EXACT || number < -MAX_EXACT) {
                    throw IllegalStateException(
                        "Column ${statement.getColumnName(column)} holds a whole number too large to use: $number",
                    )
                }
                number
            }
            2 -> statement.getDouble(column)
            3 -> statement.getText(column)
            4 -> JSObject().put("\$blob", Base64.encodeToString(statement.getBlob(column), Base64.NO_WRAP))
            else -> JSONObject.NULL
        }

    private inline fun <T> SQLiteStatement.used(block: (SQLiteStatement) -> T): T {
        try {
            return block(this)
        } finally {
            close()
        }
    }

    /**
     * The statements of a script, split on the semicolons between them:
     * never inside a string, a quoted name or a comment. This is how the
     * WebAssembly build's own `exec` reads a script.
     */
    private fun statementsOf(script: String): List<String> {
        val statements = mutableListOf<String>()
        val current = StringBuilder()
        var state = ' ' // ' ' plain, '\'' and '"' quoted, '-' line comment, '*' block comment
        var at = 0
        while (at < script.length) {
            val char = script[at]
            val next = if (at + 1 < script.length) script[at + 1] else '\u0000'
            when (state) {
                '\'', '"' -> {
                    current.append(char)
                    if (char == state) state = ' '
                }
                '-' -> {
                    current.append(char)
                    if (char == '\n') state = ' '
                }
                '*' -> {
                    current.append(char)
                    if (char == '*' && next == '/') {
                        current.append(next)
                        at += 1
                        state = ' '
                    }
                }
                else -> when {
                    char == '\'' || char == '"' -> {
                        state = char
                        current.append(char)
                    }
                    char == '-' && next == '-' -> {
                        state = '-'
                        current.append(char)
                    }
                    char == '/' && next == '*' -> {
                        state = '*'
                        current.append(char)
                    }
                    char == ';' -> {
                        statements.add(current.toString())
                        current.clear()
                    }
                    else -> current.append(char)
                }
            }
            at += 1
        }
        statements.add(current.toString())
        return statements.filter { holdsSql(it) }
    }

    /** Whether anything is left of `statement` once comments are taken out. */
    private fun holdsSql(statement: String): Boolean {
        val bare = statement
            .replace(Regex("/\\*.*?\\*/", RegexOption.DOT_MATCHES_ALL), " ")
            .replace(Regex("--[^\n]*"), " ")
        return bare.isNotBlank()
    }
}
