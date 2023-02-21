# vite-plugin-module
 plugin to get vite module info

### Before

```javascript
import { id } from "module";

console.log(id);
```

### After

```javascript
console.log("@/views/HomePage.tsx");
```

# Config

```javascript
const moduleRollupPlugin = require('rollup-plugin-module');
const moduleVitePlugin = require('vite-plugin-module');

const plugins = [
	{
		...moduleRollupPlugin({
			baseUrl: "./src",
			idPrefix: "@/",
			include: ['src/**'],
			exclude: [/\.(html|css|scss)(\?.*)?/]
		}),
		enforce: "pre",
		apply: "build"
	},
	{
		...moduleVitePlugin({
			baseUrl: "./src",
			idPrefix: "@/",
			include: ['src/**'],
			exclude: [/\.(html|css|scss)(\?.*)?/]
		}),
		apply: "serve"
	}
]
```
