
__This app turns a formatted XML file into a static Linktree-style webpage__

## Install

- Run `npm i -g xml-to-linkpage` to install globally

### Bootstrap

- Run `xml-to-linkpage init` to bootstrap new project

## Usage

- Open terminal to directory with xml file
- Run `xml-to-linkpage`
- Place your favicon and logo inside the generated `/img` folder
    - Favicon must be named `favicon.png`
    - Logo must be named `logo.png`

## CLI Options

- `xml-to-linkpage -h` to display help message
- `xml-to-linkpage <input-dir> <output-dir>` to specify input/output directories

## Exmaple XML

```xml
<page>
    <title>Title Bar</title>
    <handle>Handle</handle>
    <links>
        <link url="https://google.com">Google</link>
        <link url="https://Youtube.com">Youtube</link>
    </links>
    <styles>
        <var name="--theme-background-main">#ffffff</var>
        <var name="--theme-background-link-btn">#dddddd</var>
        <var name="--theme-color-main">#000000</var>
        <var name="--theme-color-link-btn">#000000</var>
    </styles>
</page>
```

### Options

Add `defaultIcons="false"` to `<page>` to disable default icons. Make sure to supply your own image files instead.

```xml
<page defaultIcons="false"></page>
```

### Background Images

__Create background images by using the img tag__

```xml
<img>
    <var name="--background-img-main">./img/background-img-main.jpg</var>
    <var name="--background-img-link-btn" repeat="no-repeat" size="contain">./img/background-img-main.jpg</var>
    <var name="--img-copy">./img/copy.png</var>
    <var name="--img-clipboard">./img/clipboard.png</var>
</img>
```

#### Options

- Tag Content - Sets the `background-img` url for either background
- repeat - Sets the `background-repeat` value for either background
- size - Sets the `background-size` value for either background

```xml
<var name="--background-img-main" repeat="no-repeat">./img-main.png</var>
<var name="--background-img-link-btn" size="contain">./img-link.png</var>
```

### All CSS Vars

```xml
<var name="--font-size-small">1.3em</var>
<var name="--font-size-large">2em</var>
<var name="--spacing-xs">4px</var>
<var name="--spacing-small">12px</var>
<var name="--spacing-medium">16px</var>
<var name="--spacing-large">24px</var>
<var name="--spacing-xl">10vh</var>
<var name="--font-family-primary">Inter, sans-serif</var>
<var name="--font-weight-header">400</var>
<var name="--font-weight-link">400</var>
<var name="--theme-background-main">#ffffff</var>
<var name="--theme-background-link-btn">#dddddd</var>
<var name="--theme-copy-btn-hover">#ffffff3b</var>
<var name="--theme-color-main">#000000</var>
<var name="--theme-color-link-btn">#000000</var>
```
