# vscode-powertools

[![Share via Facebook](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools) [![Share via Pinterest](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools) [![Share via Wordpress](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools)


[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/egodigital.vscode-powertools.svg)](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/egodigital.vscode-powertools.svg)](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/egodigital.vscode-powertools.svg)](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools#review-details)

A swiss army knife with lots of tools, extensions and (scriptable) enhancements for [Visual Studio Code](https://code.visualstudio.com/).

## Table of contents

1. [Install](#install-)
2. [How to use](#how-to-use-)
   * [Apps](#apps-)
   * [Buttons](#buttons-)
   * [Commands](#commands-)
   * [Events](#events-)
   * [Jobs](#jobs-)
   * [Scripts](#scripts-)
   * [Startups](#startups-)
   * [Values](#values-)
3. [Contribute](#contribute-)
4. [Related projects](#related-projects-)
   * [vscode-helpers](#vscode-helpers-)

## Install [[&uarr;](#table-of-contents)]

Launch VS Code Quick Open (`Ctrl + P`), paste the following command, and press enter:

```bash
ext install vscode-powertools
```

Or search for things like `vscode-powertools` in your editor.

## How to use [[&uarr;](#table-of-contents)]

### Apps [[&uarr;](#settings-)]

Apps are [Node.js based scripts](https://nodejs.org/), which are running with a [web view](https://code.visualstudio.com/api/extension-guides/webview) and can also interact with a [Visual Studio Code](https://code.visualstudio.com/api/references/vscode-api) instance.

![demo-apps1.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-apps1.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Apps).

### Buttons [[&uarr;](#settings-)]

Buttons can be used to run tasks, like scripts or shell commands, by user's click.

![demo-button.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-buttons.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Buttons).

### Commands [[&uarr;](#settings-)]

To enhance your editor, you can register custom [commands](https://code.visualstudio.com/api/references/commands), which can be used from anywhere in the editor, by using the [API](https://code.visualstudio.com/api/references/vscode-api), e.g.

![demo-commands.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-commands.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Commands).

### Events [[&uarr;](#settings-)]

The extension makes it possible to run tasks, like scripts, on specific events.

![demo-events.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-events.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Events).

### Jobs [[&uarr;](#settings-)]

Jobs can be used to run tasks, like scripts or shell commands, periodically.

![demo-jobs.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-jobs.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Jobs).

### Scripts [[&uarr;](#settings-)]

Scripts can be used to any kind of custom logic for a workspace.

![demo-scripts.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-scripts.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Scripts).

### Startups [[&uarr;](#settings-)]

*Startups* are similar to *Autostart* in Windows.

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Startups).

### Values [[&uarr;](#settings-)]

Values (or *placeholders*) can be used to define dynamic settings, e.g.

![demo-values.gif](https://raw.githubusercontent.com/mkloubertego/vscode-powertools/master/img/demo-values.gif)

For more information, have a look at the [wiki](https://github.com/mkloubertego/vscode-powertools/wiki/Values).

## Contribute [[&uarr;](#table-of-contents)]

If you like the extension, you are welcome to contribute, by [opening an issue](https://github.com/egodigital/vscode-powertools/issues) and/or fork this repository.

To work with the code:

* install [vscode-deploy-reloaded](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-deploy-reloaded) extension
* clone [this repository](https://github.com/egodigital/vscode-powertools)
* create and change to a new branch, like `git checkout -b my_new_feature`
* run `npm install` from your project folder
* open that project folder in Visual Studio Code
* select command `Deploy Reloaded: Deploy ...` (by pressing `F1`) and execute `Package ...` to copy all web view resources files from `/src/res` to `/out/res` ... also do this after you have reset your `/out` folder
* now you can edit and debug there
* commit your changes to your new branch and sync it with your forked GitHub repo
* make a [pull request](https://github.com/egodigital/vscode-powertools/pulls)

## Related projects [[&uarr;](#table-of-contents)]

### vscode-helpers [[&uarr;](#related-projects-)]

[vscode-helpers](https://github.com/mkloubert/vscode-helpers) is a NPM module, which you can use in your own [VSCode extension](https://code.visualstudio.com/docs/extensions/overview) and contains a lot of helpful classes and functions.
