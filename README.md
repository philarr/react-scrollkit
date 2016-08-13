# react-scrollkit
Directive for basic scrolling and smooth scrolling. (https://github.com/fisshy/react-scroll)

This repo has additional Helper components to allow on scroll Reveals, lazy loading and state change on reaching a defined X/Y goal.

###Reveal
Properties

- `name` Identify component's DOM node (string, required)

- `delay` Delay before activeClass is applied in ms (int, optional)

- `offset` Y-coord offset from element's top (int, optional)

- `once` Whether effect is applied again on entering viewport. Defaults `true` (boolean, optional)

- `lazy` Whether to render children components on entering viewport. Defaults `false` (boolean, optional)

- `activeClass` Custom class to be applied to element on entering viewport. Default is 'active' (string, optional)

Usage

```html
<Reveal name="component1" delay=500 offset=-100 lazy=true>
  <div></div>
</Reveal>
```


###LazyImage
Properties

- `src` Path to image (required)

- `offset` Y-coord offset from element's top (int, optional)

-  `wrapper` Component to wrap the image in

- `wrapperClass` Wrapper component's class

- `activeClass` Custom class to be applied to the image element on loaded event. Default is 'active' (string, optional)

Usage

```html
<LazyImage src="/path/to/image/lazy.png" className="browser-mockup shadow-2 animated-before" activeClass="fadeInto" />
```







