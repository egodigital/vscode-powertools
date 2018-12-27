/**
 * This file is part of the vscode-powertools distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * vscode-powertools is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-powertools is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */


/**
 * An example script.
 */
export const EXAMPLE_SCRIPT = `

const MAX_USER_COUNT = 20;

$clear();

await $withProgress(async (progress, cancelToken) => {
    progress.report({
        message: \`Loading list of random users from 'randomuser.me' ...\`,
    });

    // s. https://github.com/mkloubert/vscode-helpers#get-
    const RESPONSE = await $helpers.GET('https://randomuser.me/api?nat=de&results=' + MAX_USER_COUNT);
    if (200 !== RESPONSE.code) {
        throw new Error(\`Unexpected response: [\${ RESPONSE.code }] '\${ RESPONSE.status }'\`);
    }

    const RESULTS_WITH_USERS = JSON.parse(
        (await RESPONSE.readBody())
            .toString('utf8')
    );

    if (!RESULTS_WITH_USERS.info.results) {
        $vscode.window.showWarningMessage('No users available!');
        return;
    }

    const ALL_USERS = RESULTS_WITH_USERS.results;

    for (let i = 0; i < ALL_USERS.length; i++) {
        if (cancelToken.isCancellationRequested) {
            return;  // user wants to cancel
                     // from progress window
        }

        if ($cancel.isCancellationRequested) {
            return;  // user wants to cancel
                     // from console window
        }

        const USER = ALL_USERS[i];

        progress.report({
            message: \`Processing user '\${ USER.name.last }, \${ USER.name.first }' ...\`,
            increment: 1 / ALL_USERS.length * 100.0,
        });

        const USER_META = [
            \`gender: \${ USER.gender }\`,
            \`id: \${ USER.login.uuid }\`,
            \`mail: \${ USER.email }\`,
            \`country: \${ USER.nat }\`,
        ];

        $writeMarkdown(\`## [\${ i + 1 }] \${ $html.encode(USER.name.last + ', ' + USER.name.first) }\`);
        $writeMarkdown(
              \`| Icon | Meta |\\n\`
            + \`| ---- | ---- |\\n\`
            // icon
            + \`| ![\${ $html.encode(USER.name.last + ', ' + USER.name.first) }](\${ USER.picture.medium }) | \`
            // meta
            + \`\${ USER_META.map(m => $html.encode(m)).join('<br />') } |\\n\`
        );

        await $sleep(0.5);
    }
});
`;
