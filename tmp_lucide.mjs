import * as lucide from './node_modules/lucide-react/dist/esm/lucide-react.js';

const requiredIcons = ["Play", "Pause", "RotateCcw", "Plus", "Trash2", "Move", "Navigation", "Volume2", "VolumeX", "Code2", "Radio", "CheckCircle", "FastForward", "TableProperties", "Component", "Route", "XCircle", "Calculator"];

const missing = [];
for (const icon of requiredIcons) {
   if (!lucide[icon]) {
      missing.push(icon);
   }
}

console.log("Missing icons:", missing);
