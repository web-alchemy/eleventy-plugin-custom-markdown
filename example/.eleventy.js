const EleventyPluginCustomMakdown = require('../.eleventy.js')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyPluginCustomMakdown, {
    // filter(inputContent, inputPath) {},

    dataParsers: [
      function parseDataFromMakdown(DOM) {
        const title = DOM.document.firstElementChild
        const excerptElements = []

        const hasTitle = title?.tagName === 'H1'
        const hasExcerpt = title?.nextElementSibling?.tagName === 'HR' || title?.tagName === 'HR'
        const startExcerpt = hasTitle ? title.nextElementSibling : title
        let excerptElement = startExcerpt

        if (hasExcerpt) {
          while (excerptElement) {
            excerptElement = excerptElement.nextSibling

            if (excerptElement?.tagName === 'HR') {
              excerptElement.remove()
              break
            }
            excerptElements.push(excerptElement)
          }

          startExcerpt.remove()
          for (const element of excerptElements) {
            element?.remove()
          }
        }

        if (hasTitle) {
          title.remove()
        }

        return {
          title: hasTitle && title.innerHTML,
          excerpt: excerptElements.length > 0 && excerptElements.map(element => element.outerHTML).join(''),
          body: DOM.document.toString()
        }
      },
      function parseTableOfContents(DOM) {
        const headings = DOM.document.querySelectorAll('h2, h3, h4, h5, h6')

        if (headings.length === 0) {
          return;
        }

        class Heading {
          constructor(element) {
            this.element = element
            this.children = []
            this.parent = null
          }

          get content() {
            return this.element?.textContent
          }

          get id() {
            return this.element?.id
          }

          get level() {
            return parseInt(this.element?.tagName.slice(1) ?? 0)
          }

          toJSON() {
            return {
              id: this.id,
              content: this.content,
              level: this.level,
              children: this.children,
            }
          }
        }

        function getParent(previous, current) {
          if (current.level > previous.level) {
            return previous
          } else if (current.level === previous.level) {
            return previous.parent
          } else {
            return getParent(previous.parent, current)
          }
        }

        function createHierarchy(headings) {
          const rootItem = new Heading()
          rootItem.parent = rootItem

          let previousItem = rootItem

          for (const heading of headings) {
            const currentItem = new Heading(heading)
            const parentItem = getParent(previousItem, currentItem)
            currentItem.parent = parentItem
            parentItem.children.push(currentItem)
            previousItem = currentItem
          }

          return rootItem
        }


        return {
          tableOfContents: createHierarchy(headings)
        }
      }
    ],

    render(inputContent, inputPath) {
      return (data) => {
        return data.body
      }
    },

    transforms: [
      (DOM, inputContent, inputPath, data) => {}
    ]
  })

  eleventyConfig.addCollection('articles', (collectionAPI) => {
    return collectionAPI.getFilteredByGlob('src/articles/*/*.md')
  })

  return {
    dir: {
      input: 'src'
    }
  }
}