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
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getRoot,
  $createLineBreakNode,
} from 'lexical';
import { client } from '@gradio/client';
import { useState } from 'react';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import {
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { $getNodeByKey, $createTextNode } from 'lexical';
import InlineImagePlugin from './plugins/InlineImagePlugin';
import { InlineImageNode } from './nodes/InlineImageNode';
import ImagesPlugin from './plugins/ImagesPlugin';
import { ImageNode } from './nodes/ImageNode';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';

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
    InlineImageNode,
    ImageNode,
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
          <FloatingTextFormatToolbarPlugin
            anchorElem={floatingAnchorElem}
          ></FloatingTextFormatToolbarPlugin>
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <InlineImagePlugin></InlineImagePlugin>
          <ImagesPlugin></ImagesPlugin>
        </div>
        <br></br>
        <AIPromptInput></AIPromptInput>
      </div>
    </LexicalComposer>
  );
}

function AIPromptInput() {
  const [editor] = useLexicalComposerContext();

  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fillInput = (text: string) => {
    setUserInput(text)
  }
  const askAI = async () => {
    try {
      setLoading(true);
      const allText = editor.getRootElement()?.textContent;
      setUserInput('');
      const app = await client(import.meta.env.VITE_APP_GRADIO_CLIENT_URL, {});
      const res = await app.predict('/chat', [
        userInput,
        allText, // not used but required for Gradio API
      ]);

      editor.update(() => {
        let root = $getRoot();
        const paragraph = $createParagraphNode();
        const lb = $createLineBreakNode();
        const emptyTextNode = $createTextNode('\n\n');
        paragraph.append(lb);
        paragraph.append(emptyTextNode);
        root.append(paragraph);
        const previousMd = $convertToMarkdownString(TRANSFORMERS);
        $convertFromMarkdownString(
          previousMd + '\n\n' + res.data[0],
          TRANSFORMERS
        );
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <form
        style={{ width: '100%', display: 'flex' }}
        onSubmit={(event) => {
          event.preventDefault();
          askAI();
        }}
      >
        <TextField
          style={{ backgroundColor: 'white', flex: 1 }}
          id="outlined-multiline-flexible"
          className="bg-white"
          label=""
          value={userInput}
          onChange={(event) => {
            setUserInput(event.target.value);
          }}
          // maxRows={40}
        />
        <IconButton type="submit">
          {loading ? (
            <CircularProgress></CircularProgress>
          ) : (
            <ArrowUpwardIcon />
          )}
        </IconButton>
      </form>
      <Card>
        <CardContent>
          <Typography variant="h6" component="div">
            Exemples de prompts
          </Typography>
          <Typography variant="body2">
            <br></br>
            {exemplePrompts.map((prompt) => (
              <ListItemButton component="a" href="#simple-list" onClick={() => fillInput(prompt)}>
                <ListItemText primary={prompt} />
              </ListItemButton>
            ))}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

const exemplePrompts = [
  "Rédige une analyse de la phénologie décrivant les différentes situations observées pour la culture sur le réseau Charentes",
  "Rédige une courte synthèse sur les conditions météorologiques des 7 derniers jours ainsi que sur les prévisions météorologiques pour la semaine à venir.",
  "Rédige un encart « biodiversité » sur les auxiliaires de culture de la vigne présent sur la période en cours (bénéfices, ravageurs ciblés et conseils pratiques).",
  "Rédige un encart “mémo de l’Observateur” qui fait un résumé des bonnes pratiques d’observations aux champs et suggère la recherche de premiers symptômes pour les bioagresseurs à forte pression épidémiologique sur la période en cours.",
  "A partir du bulletin de santé végétal, rédige une rubrique de synthèse intitulé “Ce qu’il faut retenir”, comprenant un récapitulatif de deux lignes maximum sur les éléments essentiels à retenir."
]
