package org.fretty.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    // only grant microphone access
                    for (String resource : request.getResources()) {
                        if (resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            request.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
                            return;
                        }
                    }
                    // deny anything else
                    request.deny();
                });
            }
        });
    }
}
