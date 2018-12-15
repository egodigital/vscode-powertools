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

import * as ego_helpers from './helpers';
import * as ego_webview from './webview';


/**
 * Options for the constructor of ''MarkdownWebView class.
 */
export interface MarkdownWebViewOptions {
    /**
     * The markdown content.
     */
    markdown: any;
    /**
     * The optional title.
     */
    title?: any;
}


/**
 * A web view showing a markdown document.
 */
export class MarkdownWebView extends ego_webview.WebViewBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {MarkdownWebViewOptions} markoptionsdown The options.
     */
    public constructor(
        public readonly options: MarkdownWebViewOptions,
    ) {
        super();
    }

    /**
     * @inheritdoc
     */
    protected generateHtmlBody(): string {
        return `
<script type="text/javascript">

const EGO_MARKDOWN_CONTENT = ${ JSON.stringify(
    ego_helpers.toStringSafe(this.options.markdown)
) };

</script>
`;
    }

    /**
     * @inheritdoc
     */
    protected getTitle(): string {
        return ego_helpers.toStringSafe(
            this.options
                .title
        );
    }

    /**
     * @inheritdoc
     */
    protected getType(): string {
        return 'MarkdownDocument';
    }
}
