# The text recogniser plugin names the optional Chinese, Devanagari, Japanese
# and Korean recognisers; we ship only the Latin one (MM-44), so R8 must not
# fail on the missing classes.
-dontwarn com.google.mlkit.vision.text.chinese.**
-dontwarn com.google.mlkit.vision.text.devanagari.**
-dontwarn com.google.mlkit.vision.text.japanese.**
-dontwarn com.google.mlkit.vision.text.korean.**
