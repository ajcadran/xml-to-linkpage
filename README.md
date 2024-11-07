
__This node app allows the user to turn a formatted XML file into a static Linktree style webpage__

## Install

- Run `npm i -g xml-to-linkpage` to install globally

## Usage

- Open terminal to directory with xml file
- Run `xml-to-linkpage`
- Place your favicon and logo inside the generated `/img` folder
    - Favicon must be named `favicon.png`
    - Logo must be named `logo.png`

## CLI Options

- `xml-to-linkpage -h` to display help message
- `xml-to-linkpage <input-dir> <output-dir>` to use directories other than the current directory

## Exmaple XML

```xml
<page>
    <title>Title Bar</title>
    <handle>Handle</handle>
    <links>
        <link>
            <text>Google</text>
            <url>https://google.com</url>
        </link>
        <link>
            <text>Youtube</text>
            <url>https://Youtube.com</url>
        </link>
    </links>
    <styles>
        <var name="--theme-background-main">#ffffff</var>
        <var name="--theme-background-link-btn">#dddddd</var>
        <var name="--theme-color-main">#000000</var>
        <var name="--theme-color-link-btn">#000000</var>
    </styles>
</page>
```

## All CSS Vars

```xml
<var name="--font-size-small">1.3em</var>
<var name="--font-size-large">2em</var>
<var name="--spacing-xs">4px</var>
<var name="--spacing-small">12px</var>
<var name="--spacing-medium">16px</var>
<var name="--spacing-large">24px</var>
<var name="--spacing-xl">10vh</var>
<var name="--font-family-primary">Inter, sans-serif</var>
<var name="--theme-background-main">#ffffff</var>
<var name="--theme-background-link-btn">#dddddd</var>
<var name="--theme-copy-btn-hover">#ffffff3b</var>
<var name="--theme-color-main">#000000</var>
<var name="--theme-color-link-btn">#000000</var>
```
