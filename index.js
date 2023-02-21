const path = require("path");
const MagicString = require('magic-string');
const pluginutils = require('@rollup/pluginutils');

const PREFIX = "\0module:";
const MODULE_ID_PREFIX = "moduleId_";
const MODULE_URI_PREFIX = "moduleUri_";

function modulePlugin(options) {
	if(!options) options = {};
	var { include, exclude, sourcemap } = options;
	var filter = pluginutils.createFilter(include, exclude);
	var sourceMap = options.sourceMap !== false && sourcemap !== false;

	var baseUrl = options.baseUrl ? path.resolve(process.cwd(), options.baseUrl) : process.cwd();
	baseUrl = baseUrl.replace(/\\/g, "/");
	if(!baseUrl.endsWith("/")) {
		baseUrl = baseUrl + "/";
	}
	var idPrefix = options.idPrefix || "";
	var uriPrefix = options.uriPrefix || "./";

	return {
		name: "plugin-module",
		transform(code, id) {
			if(!filter(id)) { return null; }
			var ast = null;
			try {
				ast = this.parse(code);
			} catch(err) {
				this.warn({
					code: 'PARSE_ERROR',
					message: ("vite-plugin-module: failed to parse " + id + ". Consider restricting the plugin to particular files via options.include")
				});
			}
			if(!ast) {
				return null;
			}
			var magicString = new MagicString(code);

			var changed = false;
			var namespace = null;
			var nss = new Set();
			var locals = new Map();
			var imports = new Set();
			ast.body.forEach(function(node) {
				if(node.type === 'ImportDeclaration') {
					if(node.source.value == "module") {
						changed = true;
						imports.add(node);
						node.specifiers.forEach(function(specifier) {
							if(specifier.type == "ImportNamespaceSpecifier") {
								if(!namespace) {
									namespace = specifier.local.name;
								} else {
									nss.add(specifier.local.name);
								}
							} else {
								locals.set(specifier.local.name, specifier.imported.name);
							}
						});
					}
				}
			});

			if(changed) {
				let prepend = [];
				let moduleId;
				let moduleUri;
				id = id.replace(/\\/g, "/");
				if(id.startsWith(baseUrl)) {
					id = id.substring(baseUrl.length);
					moduleId = JSON.stringify(idPrefix + id);
					moduleUri = JSON.stringify(uriPrefix + id);
				}
				if(namespace) {
					prepend.push(`var ${namespace}={id:${moduleId},uri:${moduleUri}};`);
					nss.forEach((ns) => {
						prepend.push(`var ${ns}=${namespace};`);
					});
					locals.forEach((imported, local) => {
						prepend.push(`var ${local}=${namespace}.${imported};`);
					});
				} else {
					locals.forEach((imported, local) => {
						switch(imported) {
							case "id":
								prepend.push(`var ${local}=${moduleId};`);
								break;
							case "uri":
								prepend.push(`var ${local}=${moduleUri};`);
								break;
						}
					});
				}
				magicString.prepend(prepend.join(""));
				imports.forEach((node) => {
					magicString.remove(node.start, node.end);
				});
				return {
					code: magicString.toString(),
					map: sourceMap ? magicString.generateMap({ hires: true }) : null
				};
			}
			return;
		}
	};
}

modulePlugin.default = modulePlugin;
module.exports = modulePlugin;
