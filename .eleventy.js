const fs = require('node:fs')
const { parseHTML } = require('linkedom')
const frontMatter = require('gray-matter')
const MarkdownIt = require('markdown-it')

/**
 * @callback EleventyCustomTemplateFilter
 * @param {string} inputContent
 * @param {string} inputPath
 * @returns {boolean}
 */

/**
 * @callback EleventyCustomTemplateRender
 * @param {any} data
 * @returns {string}
 */

/**
 * @callback EleventyCustomTransform
 * @param {Window} DOM
 * @param {string} inputContent
 * @param {string} inputPath
 * @param {any} data
 * @returns {void}
 */

/**
 * @callback EleventyDataParser
 * @param {Window} DOM
 * @returns {Object}
 */

/**
 * @typedef {Object} Options
 * @property {EleventyCustomTemplateFilter} [filter]
 * @property {EleventyCustomTemplateRender} [render]
 * @property {Array<EleventyCustomTransform>} [transforms]
 * @property {Array<EleventyDataParser>} [dataParsers]
 */

module.exports = function(eleventyConfig, /** @type {Options} */options = {}) {
  eleventyConfig.addExtension('md', {
    read: true,

    encoding: 'utf-8',

    async getData(inputPath) {
      if (!options.dataParsers) {
        return {}
      }

      const { content: markdown } = frontMatter(await fs.promises.readFile(inputPath, 'utf-8'))
      const markdownLib = new MarkdownIt()
      const html = markdownLib.render(markdown)
      const DOM = parseHTML(html)
      const data = {}
      for (const parser of options.dataParsers) {
        Object.assign(data, parser(DOM))
      }
      return data
    },

    async compile(inputContent, inputPath) {
      if (typeof options.filter === 'function' && !options.filter(inputContent, inputPath)) {
        return
      }

      return async function(data) {
        const markdownRenderer = options.render
          ? options.render(inputContent, inputPath)
          : this.defaultRenderer

        const content = await markdownRenderer.call(this, data)

        if (options.transforms && options.transforms.length > 0) {
          const DOM = parseHTML(content)

          for (const transform of options.transforms) {
            await transform(DOM, inputContent, inputPath, data)
          }

          return DOM.document.toString()
        } else {
          return content
        }
      }
    }
  })
}