# MilleViz

The seven Millennium Prize Problems, explained from the picture up.

Each problem gets one page: a question in plain language, then a short series of
figures you can move, then what the problem actually claims. The figures are not
decoration. They compute what they show, from the definitions, in the browser.

## The problems

| | Problem | Status |
|---|---|---|
| 01 | P versus NP | Open |
| 02 | The Riemann Hypothesis | Open |
| 03 | Navier–Stokes smoothness | Open |
| 04 | The Poincaré Conjecture | Solved 2003 |
| 05 | Yang–Mills and the mass gap | Open |
| 06 | Birch and Swinnerton-Dyer | Open |
| 07 | The Hodge Conjecture | Open |

Official problem statements are at
[claymath.org](https://www.claymath.org/millennium-problems/).

## Running it

There is no build step. `public/` is the site: plain HTML, one stylesheet, and
one ES module per page. Serve that directory with anything.

```sh
python3 -m http.server 8000 --directory public
```

Then open <http://localhost:8000>.

Fonts are self-hosted in `public/fonts/` so the pages load nothing from a third
party. Every page works without scripting for the prose; only the figures need it.

## Layout

```
public/
  index.html          the seven problems, listed
  styles.css          the whole design system
  problems/*.html     one page per problem
  js/viz.js           plotting helpers shared across pages
  js/<problem>.js     the figures for one page
design/               Claude Design canvas sources for the layout
```

## License

MIT. See [LICENSE](LICENSE).
