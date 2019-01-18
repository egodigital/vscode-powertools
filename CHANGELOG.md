# Change Log (vscode-powertools)


## 0.9.0 (January 19th, 2019; apps)

* automatic check for new [apps](https://github.com/egodigital/vscode-powertools/wiki/Apps) on start

## 0.8.1 (January 17th, 2019; tools)

* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$asc`: handles a value as string and returns its ASCII code(s)
  * `$emojis`: return a list of [emojis](https://www.npmjs.com/package/node-emoji), by using an optional filter
  * `$hash`: hashes a value
  * `$htmldec`: handles a value as string and decodes the HTML entities
  * `$htmlenc`: handles a value as string and encodes the HTML entities
  * `$md5`: hashes a value with MD5
  * `$sha1`: hashes a value with SHA-1
  * `$sha256`: hashes a value with SHA-256
  * `$sha384`: hashes a value with SHA-384
  * `$sha512`: hashes a value with SHA-512
* added following modules for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$vs`: [Visual Studio Code API](https://code.visualstudio.com/api/references/vscode-api)

## 0.7.0 (January 15th, 2019; tools)

* added `Power Tools: Tools` command, with `Code Execution ...` sub command
* updated to `change-case@3.1.0`
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$pwd`: generates a strong password
  * `$res`: resolves an (async) value
* added following [samples](https://github.com/egodigital/vscode-powertools-samples):
  * [app-vue-test](https://github.com/egodigital/vscode-powertools-samples/tree/master/app-vue-test)

## 0.6.1 (January 13th, 2019; import values to settings)

* added `globals` property to [ScriptArguments interface](https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.scriptarguments.html), which makes it possible to define global data for all scripts in the workspace settings
* added `importValues` property for [apps](https://github.com/egodigital/vscode-powertools/wiki/Apps), [buttons](https://github.com/egodigital/vscode-powertools/wiki/Buttons), [commands](https://github.com/egodigital/vscode-powertools/wiki/Commands), [events](https://github.com/egodigital/vscode-powertools/wiki/Events), [jobs](https://github.com/egodigital/vscode-powertools/wiki/Jobs) and [startups](https://github.com/egodigital/vscode-powertools/wiki/Startups), which makes it possible to import [external values](https://github.com/egodigital/vscode-powertools/wiki/Values)
* code cleanups and improvements

## 0.5.1 (January 13th, 2019; apps)

* added `globalStore` and `store` properties to [ScriptArguments interface](https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.scriptarguments.html)
* added following [apps](https://github.com/egodigital/vscode-powertools/wiki/Apps) to [store](https://egodigital.github.io/vscode-powertools/apps/store.json):
  * [data-url-converter](https://github.com/egodigital/vscode-powertools-samples/tree/master/app-data-url-converter)

## 0.4.3 (January 9th, 2019; apps)

* can define optional buttons for [workspace apps](https://github.com/egodigital/vscode-powertools/wiki/Apps#workspace-apps), which are able to start the underlying app
* can define if that `CHANGELOG.md` is opened automatically, after new version of extension has been installed (s. `Power Tools: Global Settings`)

## 0.3.0 (January 8th, 2019; apps)

* added optional `appName` parameter to `ego.power-tools.openApp` command

## 0.2.0 (January 8th, 2019; commands)

* added `arguments` property to [WorkspaceCommandScriptArguments interface](https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.workspacecommandscriptarguments.html)
* result of a [command](https://github.com/egodigital/vscode-powertools/wiki/Commands) is returned now

## 0.1.2 (January 7th, 2019; initial release)

* initial release
