import 'package:mm_food_pipeline/mm_food_pipeline.dart';
import 'package:test/test.dart';

Future<List<List<String>>> read(Iterable<String> chunks) =>
    csvRows(Stream.fromIterable(chunks)).toList();

void main() {
  test('plain rows, empty cells and a missing final newline', () async {
    expect(await read(['a,b,c\n1,,3\nx,y,z']), [
      ['a', 'b', 'c'],
      ['1', '', '3'],
      ['x', 'y', 'z'],
    ]);
  });

  test('quoted cells hold commas, doubled quotes and line breaks', () async {
    expect(await read(['n,v\n"a, ""b""\nc",2\n']), [
      ['n', 'v'],
      ['a, "b"\nc', '2'],
    ]);
  });

  test('a quoted empty cell and CRLF line ends', () async {
    expect(await read(['a,"",c\r\n1,2,3\r\n']), [
      ['a', '', 'c'],
      ['1', '2', '3'],
    ]);
  });

  test('the same rows however the text is cut into chunks', () async {
    const text = 'a,"x ""y"""\r\n"p\nq",2\n';
    final whole = await read([text]);
    for (var cut = 1; cut < text.length; cut++) {
      expect(
        await read([text.substring(0, cut), text.substring(cut)]),
        whole,
        reason: 'cut at $cut',
      );
    }
  });
}
