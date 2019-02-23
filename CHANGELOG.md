# Change Log (vscode-powertools)

## 0.26.2 (February 23rd, 2019; tools)

* added following constants for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$polyline`: converts from and to [polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
* added `Generate TypeScript code ...` sub command to `Power Tools: Tools`, which generates TypeScript code from a JSON or JavaScript editor
* bugfixes

## 0.25.0 (February 20th, 2019; code execution)

* added following constants for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$cb`: copyies a value to clipboard
  * `$cmyk`: converts CMYK color from or to hex
  * `$hsl`: converts HSL color from or to hex
  * `$rgb`: converts RGB color from or to hex

## 0.24.0 (February 18th, 2019; Azure DevOps)

* can open Azure DevOps dashboards now via `Power Tools: Azure DevOps` command

## 0.23.0 (February 16th, 2019; Azure DevOps)

* can open Azure DevOps wikis now via `Power Tools: Azure DevOps` command
* fixes
* updated the following [npm](https://www.npmjs.com/) modules:
  * [csv-parse](https://www.npmjs.com/package/csv-parse) `^4.3.3`
  * [deepmerge](https://www.npmjs.com/package/deepmerge) `^3.2.0`
  * [mime-types](https://www.npmjs.com/package/mime-types) `^2.1.22`
  * [node-emoji](https://www.npmjs.com/package/node-emoji) `^1.10.0`

## 0.22.0 (February 13th, 2019; Azure DevOps and app stores)

* added `Power Tools: Azure DevOps` command, which first feature of opening project boards
* custom store name is shown in [app webview](https://github.com/egodigital/vscode-powertools/wiki/Apps#app-stores) now
* updated the following [npm](https://www.npmjs.com/) modules:
  * [csv-parse](https://www.npmjs.com/package/csv-parse) `^4.3.2`
* code cleanups

## 0.21.2 (February 11th, 2019; TCP proxies and code execution)

* implemented [TCP proxies](https://github.com/egodigital/vscode-powertools/wiki/Tools#tcp-proxies) (`Power Tools: Tools` >> `TCP Proxies ...`)
* argument of [$csv](https://github.com/egodigital/vscode-powertools/wiki/Tools#csvdata) is optional now
* updated to [MD Bootstrap 4.7.1 (free)](https://github.com/mdbootstrap/bootstrap-material-design)
* bugfixes ... s. [issue #11](https://github.com/egodigital/vscode-powertools/issues/11)

## 0.20.0 (February 9th, 2019; code execution and output)

* [$beautify](https://github.com/egodigital/vscode-powertools/wiki/Tools#beautify) now supports XML
* [$compile](https://github.com/egodigital/vscode-powertools/wiki/Tools#compile) now supports [Pug](https://www.npmjs.com/package/pug)
* [$uglify](https://github.com/egodigital/vscode-powertools/wiki/Tools#uglify) now supports HTML and XML
* network interfaces are shown now in output (`CTRL+K CTRL+H`, `Power Tools by e.GO`) on startup
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$base64`: converts a value to a Base64 string

## 0.19.3 (February 6th, 2019; Visual Studio Code 1.31 and commands)

* extension requires at least [Visual Studio Code 1.31](https://code.visualstudio.com/updates/v1_31) now
* added `forFile` and `forFolder` properties for [commands](https://github.com/egodigital/vscode-powertools/wiki/Commands#file-explorer-and-context-menus), which can define, if a command should be executed for a file of an active editor or an item, selected from the file explorer, by using `Execute Power Command` from context menu or the command palette (`F1`) ... s. [issue #10](https://github.com/egodigital/vscode-powertools/issues/10)
* code cleanups and improvements
* fixes

## 0.17.1 (February 4th, 2019; script arguments and code execution)

* added `extension` and `state` properties to [ScriptArguments](https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.scriptarguments.html) interface
* added `json` support for `$beautify` and `$uglify` functions of [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution)
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$str`: returns a value or object as string that is NOT `(null)` and NOT `(undefined)`
* fixes
* updated the following [npm](https://www.npmjs.com/) modules:
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^4.0.1`

## 0.16.0 (February 2nd, 2019; code execution)

* added following constants for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$cancel`: the [CancellationToken](https://code.visualstudio.com/api/references/vscode-api#CancellationToken) object, to check the current progress state
  * `$e`: stores the content of the active text editor, if available
  * `$progress`: the [Progress](https://code.visualstudio.com/api/references/vscode-api#Progress) object, to control the current progress state ... s. [withProgress()](https://code.visualstudio.com/api/references/vscode-api)
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$buff`: converts a value to a [Buffer](https://nodejs.org/api/buffer.html), if needed
  * `$csv`: handles data as string in CSV format and displays them
  * `$ltrim`: handles data as string and trims from leading whitespaces
  * `$lower`: handles data as string and converts to lower case characters
  * `$rtrim`: handles data as string and trims from ending whitespaces
  * `$trim`: handles data as string and trims from leading and ending whitespaces
  * `$upper`: handles data as string and converts to upper case characters

## 0.15.1 (January 30th, 2019; code execution)

* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$beautify`: beautifies the code in the active editor and opens the result in a new one
  * `$compile`: compiles the code in the active editor and opens the result in a new one
  * `$uglify`: uglifies the code in the active editor and opens the result in a new one
* HTTP responses, from [code executions](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution) e.g., are beautified and can be copied to clipboard now
* progress is displayed, when [executing code](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution)
* (bug)fixes

## 0.14.0 (January 28th, 2019; scripts and code execution)

* [scripts](https://github.com/egodigital/vscode-powertools/wiki/Scripts) can run via [CoffeeScript language](https://coffeescript.org) now
* added `globalState` and `state` properties to [ScriptArguments interface](https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.scriptarguments.html)
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$alert`: shows a (warning) popup
  * `$full`: returns a full path
  * `$md`: handles a value as [Markdown](https://github.com/showdownjs/showdown) string
  * `$read`: reads data from a file
  * `$write`: writes data to a file
* added following functions for [Scripts](https://github.com/egodigital/vscode-powertools/wiki/Scripts):
  * `$alert`: shows a (warning) popup
* added following modules for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$o`: [opn]((https://www.npmjs.com/package/opn)

## 0.13.1 (January 26th, 2019; events and code execution)

* added `document.opened` [event](https://github.com/egodigital/vscode-powertools/wiki/Events)
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$now`: returns the current [time](https://momentjs.com/), with an optional [timezone](https://momentjs.com/timezone/)
  * `$utc`: returns the current [time](https://momentjs.com/) in [UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time)
* added following modules for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$m`: [Moment.js](https://momentjs.com/)

## 0.12.2 (January 23rd, 2019; global buttons and jobs)

* fixed scripting in [events](https://github.com/egodigital/vscode-powertools/wiki/Events)
* [buttons](https://github.com/egodigital/vscode-powertools/wiki/Buttons), [commands](https://github.com/egodigital/vscode-powertools/wiki/Commands), [jobs](https://github.com/egodigital/vscode-powertools/wiki/Jobs) and [values](https://github.com/egodigital/vscode-powertools/wiki/Values) can be defined [globally](https://github.com/egodigital/vscode-powertools/wiki/Global%20Settings) now ... s. [issue #4](https://github.com/egodigital/vscode-powertools/issues/4)
* removed shortcut commands to restart / start and stop all jobs

## 0.11.0 (January 23rd, 2019; npm update & bug fixes)

* bug fix: there was no auto creation of `.vscode-powertools` sub folder in home directory, when using [store](https://egodigital.github.io/vscode-powertools/api/classes/_stores_.userstore.html) in scripts, e.g. ... s. [issue #7](https://github.com/egodigital/vscode-powertools/issues/7)
* updated the following [npm](https://www.npmjs.com/) modules:
  * [moment](https://www.npmjs.com/package/moment) `^2.24.0`

## 0.10.1 (January 21st, 2019; config and tools)

* added `imports` setting, which can define one or more external setting files to import
* added following functions for [Code Execution](https://github.com/egodigital/vscode-powertools/wiki/Tools#code-execution):
  * `$DELETE`: starts a HTTP DELETE request
  * `$exec`: executes the code in the currently running editor
  * `$GET`: starts a HTTP GET request
  * `$ip`: tries to detect the public IP address
  * `$ip4`: tries to detect the public IP address (version 4)
  * `$ip6`: tries to detect the public IP address (version 6)
  * `$PATCH`: starts a HTTP PATCH request
  * `$POST`: starts a HTTP POST request
  * `$PUT`: starts a HTTP PUT request
* added `onCreated` and `onDestroyed` settings for [apps](https://github.com/egodigital/vscode-powertools/wiki/Apps), [buttons](https://github.com/egodigital/vscode-powertools/wiki/Buttons), [commands](https://github.com/egodigital/vscode-powertools/wiki/Commands), [events](https://github.com/egodigital/vscode-powertools/wiki/Events) and [jobs](https://github.com/egodigital/vscode-powertools/wiki/Jobs)
* added `$s` constant for [executable settings](https://github.com/egodigital/vscode-powertools/wiki/Executable%20Settings)
* updated help (press `F1` and select `Power Tools: Help` command)
* fixes

## 0.9.3 (January 19th, 2019; apps and values)

* automatic check for new [apps](https://github.com/egodigital/vscode-powertools/wiki/Apps) on start
* added predefined value `activeFile` ... s. [issue #5](https://github.com/egodigital/vscode-powertools/issues/5)
* added `wait` setting for all [actions](https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.withshellcommand.html), which run a shell command
* fixes

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
