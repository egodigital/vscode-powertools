# vscode-powertools

[![Share via Facebook](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools) [![Share via Pinterest](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools) [![Share via Wordpress](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/egodigital/vscode-powertools/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Degodigital.vscode-powertools)


[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/egodigital.vscode-powertools.svg)](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/egodigital.vscode-powertools.svg)](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/egodigital.vscode-powertools.svg)](https://marketplace.visualstudio.com/items?itemName=egodigital.vscode-powertools#review-details)

A swiss army knife with lots of tools, extensions and (scriptable) enhancements for [Visual Studio Code](https://code.visualstudio.com/).

## Table of contents

1. [Install](#install-)
2. [How to use](#how-to-use-)
   * [Settings](#settings-)
     * [Apps](#apps-)
     * [Commands](#commands-)
     * [Jobs](#jobs-)
     * [StartUps](#startups-)
     * [Values](#values-)
3. [Support and contribute](#support-and-contribute-)
   * [Contributors](#contributors-)
4. [Related projects](#related-projects-)
   * [vscode-helpers](#vscode-helpers-)

## Install [[&uarr;](#table-of-contents)]

Launch VS Code Quick Open (`Ctrl + P`), paste the following command, and press enter:

```bash
ext install vscode-powertools
```

Or search for things like `vscode-powertools` in your editor.

## How to use [[&uarr;](#table-of-contents)]

### Settings [[&uarr;](#how-to-use-)]

#### Apps [[&uarr;](#settings-)]

An app is a [Node.js script](https://nodejs.org/), which runs inside a web view.

To register an app for a workspace, create an `apps` section in the `settings.json` file, stored in the `.vscode` sub folder:

```json
{
    "ego.power-tools": {
        "apps": [
            {
                "script": "my-app.js",
                "title": "My app",
                "description": "An awesome app"
            }
        ]
    }
}
```

First create a `my-app.ejs` file inside the `.vscode` sub folder of the workspace with the HTML content of your app:

```html
<h1><%= page_title %></h1>

<pre id="myTestPre"></pre>

<style>

/* put your custom styles here */

</style>

<script>

/**
 * This is called, when a command
 * has been received from the app script.
 */
function ego_on_command(command, data) {
    $('#myTestPre').text(
        'Received from script: ' + JSON.stringify({
            'command': command,
            'data': data
        }, null, 2)
    );
}

/**
 * This is called, after the
 * page has been completely loaded.
 */
function ego_on_loaded() {
    setTimeout(() => {
        // post a command to the script
        // have a look at the
        // 'onEvent()' below ('on.command')
        ego_post(
            'myWebViewCommand',
            {
                'TM': '1979-09-05',
                'MK': '1979-09-23'
            }
        );
    }, 5000);
}

</script>
```

Then create a `my-app.js` file inside the same folder and use the following skeleton:

```javascript
/**
 * This returns the HTML code for the body.
 */
exports.getHtml = (args) => {
    return args.renderFile(
        'my-app.ejs',
        {
            'page_title': 'My awesome app',
        }
    );
};

/**
 * This returns the title, which is displayed in the tab
 * of the web view.
 */
exports.getTitle = () => {
    return `My awesome app`;
};

/**
 * Is invoked on an event.
 */
exports.onEvent = async (args) => {
    switch (args.event) {
        case 'on.command':
            // is invoked, when the web view has
            // been post a (command) message
            // 
            // args.data.command => (string) The name of the command.
            // args.data.data    => (any) The data of the command.

            args.require('vscode').window.showInformationMessage(
                'Received from script: ' + JSON.stringify({
                    'command': args.data.command,
                    'data': args.data.data
                }, null, 2)
            );
            break;

        case 'on.loaded':
            // page inside web view has been completely loaded

            // post a command to web view
            // have a look at the upper
            // 'ego_on_command()' function
            await args.post(
                'myScriptCommand',
                {
                    'TM': 5979,
                    'MK': 23979
                }
            );
            break;
    }
};
```

To execute the app, press `F1`, execute `Powet Tools: Apps` command and select the app.

An `apps` entry in the `settings.json` file supports the following properties:

| Name | Description | Required? | 
| ---- | ----------- | :-------: |
| `script` | The path to the script, that should be invoked. Relative paths will be mapped to the `.vscode` sub folder inside the underlying workspace OR to the `.vscode-powettools` sub folder inside the user's home directory. | yes |
| `description` | A description for the app. | no |
| `name` | The (display) name. | no |
| `options` | Options for the script. | no |

#### Commands [[&uarr;](#settings-)]

@TODO

#### Jobs [[&uarr;](#settings-)]

@TODO

#### StartUps [[&uarr;](#settings-)]

@TODO

#### Values [[&uarr;](#settings-)]

@TODO

## Support and contribute [[&uarr;](#table-of-contents)]

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
