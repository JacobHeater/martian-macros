package com.martianmacros

import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.IOException
import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * Moving to another phone (MM-697): a listener on the phone's Wi-Fi address while its code is shown, and connections
 * to the other phone's, carrying whole frames, each sent with its length first. What crosses is sealed by the app
 * before it reaches this plugin; the plugin only carries bytes, and only on the local network.
 */
@CapacitorPlugin(name = "MmTransfer")
class MmTransferPlugin : Plugin() {

    companion object {
        /** A sealed frame of the app's largest chunk, with room to spare: anything longer is not the app's. */
        private const val LARGEST_FRAME = 1024 * 1024 + 1024
        private const val CONNECT_WITHIN_MS = 5000
    }

    private val io = Executors.newCachedThreadPool()
    private val connections = ConcurrentHashMap<String, Socket>()

    @Volatile
    private var server: ServerSocket? = null

    @PluginMethod
    fun listen(call: PluginCall) = io.execute {
        val host = wifiAddress() ?: return@execute call.reject("This phone has no Wi-Fi address.", "noWifi")
        try {
            server?.close()
            val socket = ServerSocket()
            socket.reuseAddress = true
            socket.bind(InetSocketAddress(host, 0))
            server = socket
            call.resolve(JSObject().put("host", host.hostAddress).put("port", socket.localPort))
        } catch (error: IOException) {
            call.reject("Could not listen on the Wi-Fi.", "noWifi")
        }
    }

    @PluginMethod
    fun accept(call: PluginCall) = io.execute {
        val listening = server ?: return@execute call.reject("Not listening.", "stopped")
        try {
            call.resolve(JSObject().put("connection", register(listening.accept())))
        } catch (error: IOException) {
            call.reject("Stopped listening.", "stopped")
        }
    }

    @PluginMethod
    fun stopListening(call: PluginCall) {
        try {
            server?.close()
        } catch (_: IOException) {
        }
        server = null
        call.resolve()
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val host = call.getString("host")
        val port = call.getInt("port")
        if (host == null || port == null) return call.reject("A host and a port are needed.", "unreachable")
        io.execute {
            val socket = Socket()
            try {
                socket.connect(InetSocketAddress(InetAddress.getByName(host), port), CONNECT_WITHIN_MS)
                call.resolve(JSObject().put("connection", register(socket)))
            } catch (error: IOException) {
                socket.close()
                call.reject("Could not reach the other phone.", "unreachable")
            }
        }
    }

    @PluginMethod
    fun send(call: PluginCall) {
        val socket = connections[call.getString("connection")] ?: return call.reject("No such connection.", "broken")
        val data = call.getString("data") ?: return call.reject("Nothing to send.", "broken")
        io.execute {
            try {
                val bytes = Base64.decode(data, Base64.NO_WRAP)
                synchronized(socket) {
                    val out = DataOutputStream(socket.getOutputStream())
                    out.writeInt(bytes.size)
                    out.write(bytes)
                    out.flush()
                }
                call.resolve()
            } catch (error: IOException) {
                call.reject("The connection dropped.", "broken")
            }
        }
    }

    @PluginMethod
    fun receive(call: PluginCall) {
        val socket = connections[call.getString("connection")] ?: return call.resolve(JSObject().put("closed", true))
        io.execute {
            try {
                val input = DataInputStream(socket.getInputStream())
                val length = input.readInt()
                if (length < 0 || length > LARGEST_FRAME) {
                    socket.close()
                    return@execute call.resolve(JSObject().put("closed", true))
                }
                val bytes = ByteArray(length)
                input.readFully(bytes)
                call.resolve(JSObject().put("closed", false).put("data", Base64.encodeToString(bytes, Base64.NO_WRAP)))
            } catch (error: IOException) {
                // The other phone hung up, or the connection dropped: either way, nothing more comes.
                call.resolve(JSObject().put("closed", true))
            }
        }
    }

    @PluginMethod
    fun close(call: PluginCall) {
        val socket = connections.remove(call.getString("connection"))
        try {
            socket?.close()
        } catch (_: IOException) {
        }
        call.resolve()
    }

    override fun handleOnDestroy() {
        try {
            server?.close()
        } catch (_: IOException) {
        }
        for (socket in connections.values) {
            try {
                socket.close()
            } catch (_: IOException) {
            }
        }
        connections.clear()
        io.shutdownNow()
    }

    private fun register(socket: Socket): String {
        socket.tcpNoDelay = true
        val id = UUID.randomUUID().toString()
        connections[id] = socket
        return id
    }

    /** The phone's IPv4 address on its Wi-Fi, or null when it has none. */
    private fun wifiAddress(): Inet4Address? {
        val manager = context.getSystemService(ConnectivityManager::class.java)
        @Suppress("DEPRECATION")
        for (network in manager?.allNetworks.orEmpty()) {
            val capabilities = manager?.getNetworkCapabilities(network) ?: continue
            if (!capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) continue
            val address = manager.getLinkProperties(network)?.linkAddresses
                ?.map { it.address }
                ?.firstOrNull { it is Inet4Address && !it.isLoopbackAddress }
            if (address is Inet4Address) return address
        }
        // Some phones report no Wi-Fi network while it is up; its interface is named wlan.
        return NetworkInterface.getNetworkInterfaces()?.toList().orEmpty()
            .filter { it.isUp && it.name.startsWith("wlan") }
            .flatMap { it.inetAddresses.toList() }
            .firstOrNull { it is Inet4Address && !it.isLoopbackAddress } as Inet4Address?
    }
}
