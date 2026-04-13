import Foundation
import Capacitor

@objc(ICloudKVPlugin)
public class ICloudKVPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ICloudKVPlugin"
    public let jsName = "ICloudKV"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
    ]

    private let store = NSUbiquitousKeyValueStore.default

    public override func load() {
        // Listen for changes pushed from iCloud (e.g. from another device)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(storeDidChangeExternally),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store
        )
        // Kick off a sync on launch
        store.synchronize()
    }

    @objc private func storeDidChangeExternally(_ notification: Notification) {
        notifyListeners("externalChange", data: [:])
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key is required")
            return
        }
        let value = store.string(forKey: key)
        call.resolve(["value": value as Any])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"),
              let value = call.getString("value") else {
            call.reject("key and value are required")
            return
        }
        store.set(value, forKey: key)
        store.synchronize()
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key is required")
            return
        }
        store.removeObject(forKey: key)
        store.synchronize()
        call.resolve()
    }
}
