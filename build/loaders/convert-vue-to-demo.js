const fs = require('node:fs')
const path = require('node:path')
const { marked } = require('marked')
const handleMergeCode = require('../utils/handle-merge-code.js')
const createRenderer = require('./md-renderer')

const mdRenderer = createRenderer()

const __HTTP__
  = require('node:process').env.NODE_ENV !== 'production' ? 'http' : 'https'

const demoBlock = fs
  .readFileSync(path.resolve(__dirname, 'ComponentDemoTemplate.vue'))
  .toString()

function mergeParts({ parts, isVue }) {
  const mergedParts = {
    ...parts
  }
  mergedParts.title = parts.title
  mergedParts.content = parts.content
  mergedParts.tsCode = ''
  mergedParts.jsCode = ''
  handleMergeCode({ parts, mergedParts, isVue })
  mergedParts.tsCode = encodeURIComponent(mergedParts.tsCode)
  mergedParts.jsCode = encodeURIComponent(mergedParts.jsCode)
  return mergedParts
}

const cssRuleRegex = /([^{}]*)(\{[^}]*\})/g

// simulate scss style
// to remove dep of sass
// xxx {
//   mystyle
// }
function genStyle(sourceStyle) {
  let match
  let matched = false
  const rules = []

  // eslint-disable-next-line no-cond-assign
  while ((match = cssRuleRegex.exec(sourceStyle)) !== null) {
    matched = true
    const selector = match[1]
    const body = match[2]
    rules.push(
      selector
        .split(',')
        .map(part => `.demo-card__view ${part}, .naive-ui-doc ${part}`)
        .join(',') + body
    )
  }
  if (!matched)
    return null
  return `<style scoped>\n${rules.join('\n')}</style>`
}

function genVueComponent(parts, fileName, relativeUrl) {
  const demoFileNameReg = /<!-- DEMO_FILE_NAME -->/g
  const relativeUrlReg = /<!-- URL -->/g
  const titleReg = /<!-- TITLE_SLOT -->/g
  const contentReg = /<!-- CONTENT_SLOT -->/
  const tsCodeReg = /<!-- TS_CODE_SLOT -->/
  const jsCodeReg = /<!-- JS_CODE_SLOT -->/
  const scriptReg = /<!-- SCRIPT_SLOT -->/
  const styleReg = /<!-- STYLE_SLOT -->/
  const demoReg = /<!-- DEMO_SLOT -->/
  const languageTypeReg = /<!-- LANGUAGE_TYPE_SLOT -->/
  let src = demoBlock
  src = src.replace(demoFileNameReg, fileName)
  src = src.replace(relativeUrlReg, relativeUrl)
  if (parts.content) {
    src = src.replace(contentReg, parts.content)
  }
  if (parts.title) {
    src = src.replace(titleReg, parts.title)
  }
  if (parts.tsCode) {
    src = src.replace(tsCodeReg, parts.tsCode)
  }
  if (parts.jsCode) {
    src = src.replace(jsCodeReg, parts.jsCode)
  }
  if (parts.script) {
    const attributes = `${parts.api === 'composition' ? ' setup' : ''}${
      parts.language === 'ts' ? ' lang="ts"' : ''
    }`
    const startScriptTag = `<script${attributes}>\n`
    src = src.replace(scriptReg, `${startScriptTag + parts.script}\n</script>`)
  }
  if (parts.language) {
    src = src.replace(languageTypeReg, parts.language)
  }
  if (parts.style) {
    const style = genStyle(parts.style)
    if (style !== null) {
      src = src.replace(styleReg, style)
    }
  }
  if (parts.template) {
    src = src.replace(demoReg, parts.template)
  }
  if (/__HTTP__/.test(src)) {
    src = src.replace(/__HTTP__/g, __HTTP__)
  }
  return src.trim()
}

function getFileName(resourcePath) {
  const dirs = resourcePath.split('/')
  const fileNameWithExtension = dirs[dirs.length - 1]
  return [fileNameWithExtension.split('.')[0], fileNameWithExtension]
}

function getPartsOfDemo(text) {
  // slot template
  const firstIndex = text.indexOf('<template>')
  let template = text.slice(firstIndex + 10)
  const lastIndex = template.lastIndexOf('</template>')
  template = template.slice(0, lastIndex)
  const script = text.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/)?.[1]?.trim()
  const style = text.match(/<style>([\s\S]*?)<\/style>/)?.[1]
  const markdownText = text
    .match(/<markdown>([\s\S]*?)<\/markdown>/)?.[1]
    ?.trim()
  const tokens = marked.lexer(markdownText)
  const contentTokens = []
  let title = ''
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1) {
      title = token.text
    }
    else {
      contentTokens.push(token)
    }
  }
  const scriptAttributes = text
    .match(/<script([\s\S]*?)>[\s\S]*?<\/script>/)?.[1]
    .trim()
  const languageType = scriptAttributes?.includes('lang="ts"') ? 'ts' : 'js'
  const apiType = scriptAttributes?.includes('setup')
    ? 'composition'
    : 'options'
  return {
    template,
    script,
    style,
    title,
    content: marked.parser(contentTokens, {
      renderer: mdRenderer
    }),
    language: languageType,
    api: apiType
  }
}

function convertVue2Demo(content, { resourcePath, relativeUrl, isVue = true }) {
  const parts = getPartsOfDemo(content)
  const mergedParts = mergeParts({ parts, isVue })
  const [fileName] = getFileName(resourcePath)
  const vueComponent = genVueComponent(
    mergedParts,
    `${fileName}.vue`,
    relativeUrl
  )
  return vueComponent
}

module.exports = convertVue2Demo
