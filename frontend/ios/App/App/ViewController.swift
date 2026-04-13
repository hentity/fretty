import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(ICloudKVPlugin.self)
    }
}
