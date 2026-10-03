# Contributing

Bug reports, improvements, and new glyphs are welcome. Please open an [issue](https://github.com/ahmadTorkaman/dot-line/issues) for a substantial behavior change before implementing it so the approach can be discussed.

## Work locally

Fork and clone the repository. You need Node 22 or newer; there are no package dependencies to install.

```sh
npm test
npm run build
```

For the interactive source demo, run `npm start` and open `http://localhost:4173` in your browser. The optional server needs Python 3. You can also open the generated `dist/demo.html` directly.

## Make a change

- Edit glyphs and grid topology in `alphabet.mjs`, physics in `physics.mjs`, and rendering or settings in `dot-line.mjs`.
- Keep the component dependency-free and preserve collision separation, reduced-motion support, and listener cleanup.
- Add a focused regression test when fixing behavior, and update the README when changing a public setting.
- Run `npm test` and `npm run build`, then include updated `dist/` files in the pull request so downloads stay usable without a build.
- Check visual changes in a browser, including narrow containers and touch behavior when relevant.

Describe the problem, the resulting behavior, and how you checked the change in your pull request. For a bug report, include a minimal example, browser version, and the settings that reproduce it.

By contributing, you agree that your contributions will be distributed under the project's [MIT license](LICENSE).
