# Fun.Strite.art site icon

The site uses the supplied dragon-and-phone illustration, adapted to a square canvas with matching pastel sky. The artwork is kept in `dragon-artwork.png`; all icon sizes derive from this one source. The same art is provided as the social-link preview.

Regenerate PNG sizes from the project root with:

```sh
swift -module-cache-path /tmp/site-icon-swift-cache tools/build-site-icons.swift
```

The homepage declares relative icon paths, so GitHub Pages serves them along with the rest of `assets`. Keep these icon URLs stable for search crawlers. Search engines choose when to recrawl and whether to show the icon.
