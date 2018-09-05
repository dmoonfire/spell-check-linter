module.exports = SpellCheckLinter =
  activate: ->
    # We keep track of a weak map of editors and their mispellings.
    @mispellingsByEditor = new WeakMap

  provideSpellCheckStatus: ->
    return this

  provideLinter: (register) ->
    console.log("AAA", register);
    grammars = atom.config.get("spell-check.grammars")

    @linter = register({
      name: "spell-check"
    })
    return this

  addMisspellings: (editor, misspellings) ->
    @mispellingsByEditor.set editor, misspellings

  lint: (editor) ->
    # Get the file, if we don't have it, nothing to do.
    isEditor = atom.workspace.isTextEditor editor

    if not isEditor
      return null

    filePath = editor.getPath()

    if not filePath
      return null

    # See if we have misspellings.
    misspellings = @mispellingsByEditor.get editor

    if not misspellings
      return []

    # Map the misspellings to linter errors.
    messages = misspellings.map (range) ->
      {
        location: {
          file: filePath,
          position: range
        },
        excerpt: "Misspelled word: " + (editor.getTextInBufferRange(range)),
        severity: "error",
      }
    messages
