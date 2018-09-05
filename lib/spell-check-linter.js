'use babel'

import { CompositeDisposable } from 'atom';

let subscriptions;
let linter;

export function activate()
{
  subscriptions = new CompositeDisposable();
}

export function deactivate()
{
  subscriptions.dispose();
}

export function provideLinter(register)
{
  // Create the push-style linter.
  linter = register({
    name: 'spell-check',
  });
  subscriptions.add(linter)
}

export function provideSpellCheckStatus()
{
  return { addMisspellings }
}

function addMisspellings(editor, args)
{
  // If the linter hasn't been loaded, we don't do anything.
  if (!linter)
  {
    return;
  }

  // Get information about the file. If we don't have any, then
  // we don't have anything.
  const isEditor = atom.workspace.isTextEditor(editor);
  const file = editor.getPath();

  if (!isEditor || !file)
  {
    return;
  }

  // We always need to convert the spell-check errors into messages.
  const messages = getMessages(editor, file, args);

  // We have the linter loaded, so just set the messages into
  // linter.
  linter.setMessages(file, messages);
}

function getMessages(editor, file, args)
{
  // Get messages for the checkers to report loading errors.
  var checkerMessages = getCheckerMessages(editor, file, args.checkers);

  // Map the misspellings to proper messages.
  var suggestionMessages = getSuggestionMessages(editor, file, args.misspellings);

  // Return the resulting list of messages.
  return checkerMessages.concat(suggestionMessages);
}

function getCheckerMessages(editor, file, checkers)
{
  const range = editor.buffer.getRange();

  return checkers
    .filter((checker) => !checker.isEnabled())
    .map((checker) => {
      return {
        location: {
          file: file,
          position: [[0, 0], [0, 0]],
        },
        severity: "warning",
        title: checker.getId(),
        excerpt: checker.getId() + ": " + checker.getStatus(),
        priority: 0,
      };
    });
}

function getSuggestionMessages(editor, file, misspellings)
{
  return misspellings.map((misspelling) => {
    var priority = 0
    var solutions = misspelling.suggestions.map((suggestion) => {
      // If we are a suggestion, then it is a straight replacement. This
      // also renders differently on screen.
      if (suggestion.isSuggestion)
      {
        return {
          title: suggestion.label,
          position: misspelling.range,
          priority: priority++,
          replaceWith: suggestion.suggestion,
        }
      }

      return {
        title: suggestion.label,
        position: misspelling.range,
        priority: priority++,
        apply: suggestion.callback,
      };
    });

    return {
      location: {
        file: file,
        position: misspelling.range
      },
      excerpt: "Misspelled word: " + (editor.getTextInBufferRange(misspelling.range)),
      severity: "error",
      solutions: solutions
    };
  });
}
