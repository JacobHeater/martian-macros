package com.martianmacros.martian_macros.demo;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The app's own plugins (MM-232): the phone's storage and network.
        registerPlugin(MmDbPlugin.class);
        registerPlugin(MmPacksPlugin.class);
        registerPlugin(MmRemindersPlugin.class);
        registerPlugin(MmScannerPlugin.class);
        registerPlugin(MmHealthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
