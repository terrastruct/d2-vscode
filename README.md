<div align="center">
  <br />
  <div align="center">
    <img src="https://raw.githubusercontent.com/terrastruct/d2-vscode/master/docs/assets/header.png" alt="D2" />
  </div>
  <br />
</div>

[![ci](https://github.com/terrastruct/d2-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/terrastruct/d2-vscode/actions/workflows/ci.yml)
[![daily](https://github.com/terrastruct/d2-vscode/actions/workflows/daily.yml/badge.svg)](https://github.com/terrastruct/d2-vscode/actions/workflows/daily.yml)
[![license](https://img.shields.io/github/license/terrastruct/d2-vscode?color=9cf)](./LICENSE)

# VSCode extension for [D2](https://d2lang.com) files.

_Note: Requires D2 to be installed on your machine. See
[https://github.com/terrastruct/d2/tree/master#install](https://github.com/terrastruct/d2/tree/master#install)
for instructions._

## Currently Supports

- Syntax highlighting `.d2` files
- Open preview window on the side (right-click or (ctrl+shift+d) (mac -> shift+cmd+d))
- Format Document for `.d2` files
- View rendered D2 code snippets in markdown document preview
- Theme and Layout are configurable from settings and the Command Palette

```d2
x -> y

# d2-vscode can syntax highlight nested markdown correctly.
y: |`md
  # d2-vscode
  VSCode extension for [D2](https://d2lang.com) files.
`|
```

## Example

<div align="center">
  <img src="https://terrastruct-site-assets.s3.us-west-1.amazonaws.com/gifs/d2_vscode.gif" alt="D2" />
</div>

## Install

You can install using the extension sidebar or by going to the [Visual Studio Marketplace Website](https://marketplace.visualstudio.com/items?itemName=terrastruct.d2) and clicking "Install".

## Contributing

To package and install the extension locally, run:

```sh
npm install -g @vscode/vsce
yarn installdep
npm run dev
```

You can run rerun `npm run dev` after any change to install the updated extension.

Sometimes VS Code will not pick up the new extension without being restarted so you
can also run the following on macOS:

```sh
# Where d2-testing is some folder in which you want to test the extension.
osascript -e 'quit app "Visual Studio Code"'; yarn dev && code ~/d2-testing
```

### CI

CI relies on Terrastruct's shared [CI submodule](https://github.com/terrastruct/ci).

To run all CI: `./make.sh`.

To run individual jobs:

- Format: `./make.sh fmt`
- Lint: `./make.sh lint`
- Build: `./make.sh build`

Jobs only run on changed files. To force it to run on all files, add `CI_FORCE=1`. This is
what daily job does.

```
CI_FORCE=1 ./make.sh fmt
```

### Packaging

```sh
vsce package
```

Upload the output `.vsix` onto
[https://marketplace.visualstudio.com/manage/publishers/terrastruct](https://marketplace.visualstudio.com/manage/publishers/terrastruct).

### launch.json

We have a `.vscode/launch.json` that enables starting a separate debug VS Code with the
extension installed without affecting your existing VS Code instance. To use, open
`d2-vscode` with VS Code and hit `F5`. Press `CMD+R` after making changes to restart the
debug VS Code with the updated extension.

### Generating tmLanguage.json

To regenerate `d2.tmLanguage.json` after updating `d2.tmLanguage.yaml`, use [yq](https://github.com/mikefarah/yq/#install):

```sh
brew install yq
npm run gen
```

note: `npm run dev` will regenerate for you.

### Debugging Keybind

Highly recommend the following keybind for inspecting the textmate scopes under the cursor.

```json
{
  "key": "cmd+i",
  "command": "editor.action.inspectTMScopes"
}
```

### Offline Distribution

See https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix

```sh
npm install -g @vscode/vsce
npm run pkg
# To install:
# code --install-extension d2.vsix
# To uninstall:
# code --uninstall-extension terrastruct.d2
```

### markdown.tmLanguage.json

Syntax file used for markdown embedded within d2 block strings.

1. Copied from VS Code's markdown-basics extension.
2. Renamed to `markdown.d2` and scope to `text.html.markdown.d2`
3. Then with vim:
   ```
   %s/\(?:\)\?\^|\\\\G/\1(?!.*`\\\\|)(?:\^|\\\\G)/g
   ```

- This replacement ensures the markdown syntax never matches on block string
  terminators.

4. Then with sed:
   ```sh
   gsed -i -E 's/\[ \]\{[^}]*?\}/\\\\s*/' markdown.tmLanguage.json
   ```

- This replacement ensures that the markdown syntax doesn't consider leading spaces to be
  the beginning of an indented code block as in d2, block strings are indented for
  readability without the indentation being part of the string contents.

5. Now delete the `list` from `#block`. Lists for some reason eat the block string
   terminator. e.g. with them enabled the following syntax after the terminating `|`
   will remain markdown:

   ```d2
   my shape: |md
     1. first
   |

   should be d2 but VS Code highlights as markdown.
   ```

6. Add `fenced_code_block_d2` based on `fenced_code_block_css` to allow embedding markdown
   with d2 within d2.
