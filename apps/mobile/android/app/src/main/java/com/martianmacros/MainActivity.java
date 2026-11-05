package com.martianmacros;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Health Connect's link to why the app asks for its permissions (MM-68, MM-731): the privacy policy. */
    private static final String RATIONALE = "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE";
    private static final String USAGE = "android.intent.action.VIEW_PERMISSION_USAGE";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The app's own plugins (MM-232): the phone's storage and network.
        registerPlugin(MmDbPlugin.class);
        registerPlugin(MmPacksPlugin.class);
        registerPlugin(MmRemindersPlugin.class);
        registerPlugin(MmScannerPlugin.class);
        registerPlugin(MmHealthPlugin.class);
        registerPlugin(MmBackupPlugin.class);
        registerPlugin(MmTransferPlugin.class);
        super.onCreate(savedInstanceState);
    }

    /** The intent the app was opened with, or brought to the front with: the bridge's, then the rationale's. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String action = intent == null ? null : intent.getAction();
        if (RATIONALE.equals(action) || USAGE.equals(action)) MmHealthPlugin.setRationaleRequested(true);
    }
}
