import ExampleTheme from './themes/ExampleTheme';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $createTextNode,
  $createParagraphNode,
  $getRoot,
  $createLineBreakNode,
} from 'lexical';
import { client } from '@gradio/client';
import { useState } from 'react';
import React from 'react';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}

const editorConfig = {
  namespace: 'bsv',
  // The editor theme
  theme: ExampleTheme,
  // Handling of errors during update
  onError(error: any) {
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
  ],
};

export default function Editor() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement>();

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <div ref={onRef}>
                <ContentEditable className="editor-input" />
              </div>
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <DraggableBlockPlugin anchorElem={floatingAnchorElem} />

          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem}></FloatingTextFormatToolbarPlugin>
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <AIButton></AIButton>
        </div>
      </div>
    </LexicalComposer>
  );
}

function AIButton() {
  const [editor] = useLexicalComposerContext();

  const [userInput, setUserInput] = useState('');

  const askAI = async () => {
    const app = await client(import.meta.env.VITE_APP_GRADIO_CLIENT_URL, {});
    const job = app.submit('/chat', [
      userInput,
      'unused', // not used but required for Gradio API
    ]);
    setUserInput('');

    // editor.update(() => {
    //   let root = $getRoot();
    //   const paragraph = $createParagraphNode();
    //   root.append(paragraph);

    //   const textNode = $createTextNode();
    //   paragraph.append(textNode);

    //   textNode.select();
    // });

    // job.on('data', (payload) => {
    //   editor.update(() => {
    //     let root = $getRoot();
    //     root.selectEnd();
    //     const selection = $getSelection();
    //     selection.insertText(payload.data[0]);
    //   });
    // });

    // job.on('status', (status) => {
    //   if (status === 'completed') {
    //     // do something on completion
    //     textNode = null;
    //   }
    // });
  };
  return (
    <>
      <button type="submit" onClick={() => askAI()}>
        Ask AI
      </button>
      <input
        className="link-input"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
      ></input>
    </>
  );
}
