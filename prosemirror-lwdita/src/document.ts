/*!
Copyright (C) 2020 Evolved Binary

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { JDita } from "@evolvedbinary/lwdita-ast";
import { IS_MARK, defaultNodeName } from "./schema";

/**
 * Removes undefined attributes from an object
 *
 * @param object  - Generic object
 * @returns object - The object with undefined attributes removed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deleteUndefined(object?: any) {
  if (object) {
    for (const key in object) {
      if (typeof object[key] === 'undefined') {
        delete(object[key]);
      }
    }
  }
  return object;
}

/**
 * A map of special nodes that need to be handled differently.
 * Instead of using the defaultTravel function, we use the special node function
 * The following 4 nodes (audio, video, image, text) are
 * treated in a customized way instead of applying the defaultTravel() function:
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NODES: Record<string, (value: JDita, parent: JDita) => any> = {
  audio: (value) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attrs: any = deleteUndefined({ ...value.attributes });
    const content: JDita[] = [];
    if (value.children) {
      value.children.forEach(child => {
        if (child.nodeName === 'media-autoplay') {
          attrs.autoplay = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'media-controls') {
          attrs.controls = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'media-loop') {
          attrs.loop = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'media-muted') {
          attrs.muted = child.attributes?.value;
          return;
        }
        if (['desc', 'media-track', 'media-source'].indexOf(child.nodeName) > -1) {
          content.push(child);
          return;
        }
      });
    }
    const result = { type: value.nodeName, attrs, content: content.map(child => travel(child, value)) };

    if (attrs && Object.keys(attrs).length) {
      result.attrs = attrs;
    }
    return result;
  },
  video: (value) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attrs: any = deleteUndefined({ ...value.attributes });
    const content: JDita[] = [];
    if (value.children) {
      value.children.forEach(child => {
        if (child.nodeName === 'media-autoplay') {
          attrs.autoplay = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'media-controls') {
          attrs.controls = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'media-loop') {
          attrs.loop = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'media-muted') {
          attrs.muted = child.attributes?.value;
          return;
        }
        if (child.nodeName === 'video-poster') {
          attrs.poster = child.attributes?.value;
          return;
        }
        if (['desc', 'media-track', 'media-source'].indexOf(child.nodeName) > -1) {
          content.push(child);
          return;
        }
      });
    }
    const result = { type: value.nodeName, attrs, content: content.map(child => travel(child, value)) };
    return result;
  },
  image: (value) => {
    if (value.children
      && value.children[0].nodeName === 'alt'
      && value.children[0]?.children
      && value.children[0].children[0].nodeName == 'text'
      ) {
      const attrs = deleteUndefined({ ...value.attributes, alt: value.children[0].children[0].content });
      const result = { type: 'image', attrs };
      return result;
    }
    return defaultTravel(value);
  },
  text: (value: JDita) => ({ type: 'text', text: value.content, attrs: {} }),
};

/**
 * Transforms the JDita document into a proper ProseMirror document
 *
 * @param value - The JDita node
 * @returns The transformed JDita node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaultTravel(value: JDita): any {
  // children will become content
  const content = value.children?.map(child => travel(child, value));
  // attributes will become attrs
  const attrs =  value.attributes || {};
  // remove undefined attributes
  deleteUndefined(attrs);
  // node name will become type
  const type = defaultNodeName(value.nodeName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  // IS_MARK is the array  `u, s, b, sup, sub`
  if (IS_MARK.indexOf(value.nodeName) > -1) {
    if (content?.length === 1) {
      result = content[0];
      result.marks = [{ type }]
    }
  } else {
    result = {
      type,
      attrs,
    };

    if (content) {
      result.content = content;
    }
  }
  return result;
}

/**
 * Traverses the JDita document and generates a ProseMirror document
 *
 * @param value - The JDita node
 * @param parent - The parent JDita node
 * @returns The transformed JDita node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function travel(value: JDita, parent: JDita): any {
  // if it's a special node, use the special node function,
  // otherwise use the default travel function
  const result = (NODES[value.nodeName] || defaultTravel)(value, parent);
  // if the node is not a document and has attributes, set the parent attribute
  if (value.nodeName !== 'doc' && result.attrs) {
    result.attrs.parent = parent.nodeName;
  }
  return result;
}

/**
 * Transforms the JDita document
 * into a Schema compliant JDita document
 *
 * @example
 * Here's an example input:
 * ```
 * {
 *   "nodeName": "document",
 *   "children": [
 *     {
 *       "nodeName": "topic",
 *       "attributes": {
 *       "id": "intro-product"
 *     },
 *     {
 *       "nodeName": "title",
 *       "attributes": {},
 *       "children": [
 *         {
 *           "nodeName": "text",
 *           "content": "Overview"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * Here's an example output of the transformation `travel(jdita, jdita)`:
 * ```
 * {
 *   "type": "doc",
 *   "attrs": {},
 *   "content": [
 *     {
 *       "type": "topic",
 *       "attrs": {
 *         "id": "intro-product",
 *         "parent": "doc"
 *       },
 *       "content": [
 *         {
 *           "type": "title",
 *           "attrs": {
 *             "parent": "topic"
 *           },
 *           "content": [
 *             {
 *               "type": "text",
 *               "text": "Overview",
 *               "attrs": {
 *                 "parent": "title"
 *               }
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @param jdita - the JDita document
 * @returns transformed JDita document
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function document(jdita: JDita): Record<string, any> {
  if (jdita.nodeName === 'document') {
    jdita.nodeName = 'doc';
    /*
    Parameter `jdita` is representing the root of JDita document.
    We pass in the root node as the first parameter, and since it's the root node,
    it's also the parent node, which is passed as the second parameter.
    This will return the output of the transformation.
    */
    return travel(jdita, jdita);
  }
  throw new Error('jdita must be a document');
}

/**
 * Replace underscores with hyphens in node names
 *
 * @param type - The string to be modified
 * @returns The sanitized node name with hyphens
 */
function getJditaNodeName(type: string): string {
  return type.replace(/_/g, '-');
}

 /**
 * Recursively traverse through all items in the Prosemirror DOM
 * and create a JDITA object
 *
 * @param prosemirrorDocument - The Prosemirror DOM object
 * @returns The JDITA object
 */
export function unTravel(prosemirrorDocument: Record<string, any>): JDita{

  // Prosemirror content will become JDITA children
  const children = prosemirrorDocument.content?.map(unTravel);

  // attrs will become attributes
  const attributes = prosemirrorDocument.attrs || {};

  // get the node name
  const nodeName = getJditaNodeName(prosemirrorDocument.type);
  // TODO move special nodes to a separate function
  if(nodeName === 'video') {
    // we must populate the video node with the necessary attributes and children
    const allAttributes = { props: undefined, dir: undefined, "xml:lang": undefined, translate: undefined, id: undefined, conref: undefined, outputclass: attributes.outputclass,  class: undefined, width: attributes.width, height: attributes.height }

    const allChildren: JDita[] = [];
    //children[0] resembles the video desc this value does not change
    allChildren.push(children[0]) // video desc node

    if(attributes.poster !== undefined) {
      const poster: JDita = {
        nodeName: 'video-poster',
        attributes: {
          dir: undefined,
          "xml:lang": undefined,
          translate: undefined,
          name: undefined,
          value: attributes.poster,
          outputclass: undefined,
          class: undefined,
        },
        children: undefined
      };
      allChildren.push(poster);
    }

    if(attributes.controls !== undefined) {
      const controls: JDita = {
        nodeName: 'media-controls',
        attributes: {
          dir: undefined,
          "xml:lang": undefined,
          translate: undefined,
          name: undefined,
          value: attributes.controls,
          outputclass: undefined,
          class: undefined,
        },
        children: undefined
      };
      allChildren.push(controls);
    }

    if(attributes.autoplay !== undefined) {
      const autoplay: JDita = {
        nodeName: 'media-autoplay',
        attributes: {
          dir: undefined,
          "xml:lang": undefined,
          translate: undefined,
          name: undefined,
          value: attributes.autoplay,
          outputclass: undefined,
          class: undefined,
        },
        children: undefined
      };
      allChildren.push(autoplay);
    }

    if(attributes.loop !== undefined) {
      const loop: JDita = {
        nodeName: 'media-loop',
        attributes: {
          dir: undefined,
          "xml:lang": undefined,
          translate: undefined,
          name: undefined,
          value: attributes.loop,
          outputclass: undefined,
          class: undefined,
        },
        children: undefined
      };
      allChildren.push(loop);
    }

    if(attributes.muted !== undefined) {
      const muted: JDita = {
        nodeName: 'media-muted',
        attributes: {
          dir: undefined,
          "xml:lang": undefined,
          translate: undefined,
          name: undefined,
          value: attributes.muted,
          outputclass: undefined,
          class: undefined,
        },
        children: undefined
      };
      allChildren.push(muted);
    }

    allChildren.push(children[1])

    // return the created video node
    return {
      nodeName,
      'attributes': allAttributes,
      'children': allChildren
    }
  }

  if(nodeName === 'audio') {
    const allAudioAttributes = { class: undefined, conref: undefined, "xml:lang": undefined, dir: undefined, id: undefined, outputclass: attributes.outputclass,  props: undefined, translate: undefined }

    const allAudioChildren: JDita[] = [];
    allAudioChildren.push(children[0])

    if(attributes.controls !== undefined) {
      const controls: JDita = {
        nodeName: 'media-controls',
        attributes: {
          class: undefined,
          dir: undefined,
          name: undefined,
          translate: undefined,
          outputclass: undefined,
          value: attributes.controls,
          "xml:lang": undefined,
        },
        children: undefined
      };
      allAudioChildren.push(controls);
    }

    if(attributes.autoplay !== undefined) {
      const autoplay: JDita = {
        nodeName: 'media-autoplay',
        attributes: {
          class: undefined,
          dir: undefined,
          name: undefined,
          outputclass: undefined,
          translate: undefined,
          value: attributes.autoplay,
          'xml:lang': undefined,
        },
        children: undefined
      };
      allAudioChildren.push(autoplay);
    }

    if(attributes.loop !== undefined) {
      const loop: JDita = {
        nodeName: 'media-loop',
        attributes: {
          class: undefined,
          dir: undefined,
          name: undefined,
          outputclass: undefined,
          translate: undefined,
          value: attributes.loop,
          'xml:lang': undefined,
        },
        children: undefined
      };
      allAudioChildren.push(loop);
    }

    if(attributes.muted !== undefined) {
      const muted: JDita = {
        nodeName: 'media-muted',
        attributes: {
          class: undefined,
          dir: undefined,
          name: undefined,
          outputclass: undefined,
          translate: undefined,
          value: attributes.muted,
          'xml:lang': undefined,
        },
        children: undefined
      };
      allAudioChildren.push(muted);
    }

    if(attributes.source !== undefined) {
      const source: JDita = {
        nodeName: 'media-source',
        attributes: {
          class: undefined,
          dir: undefined,
          name: undefined,
          outputclass: undefined,
          translate: undefined,
          value: attributes.source,
          'xml:lang': undefined,
        },
        children: undefined
      };
      allAudioChildren.push(source);
    }

    allAudioChildren.push(children[1])

    return {
      nodeName,
      'attributes': allAudioAttributes,
      'children': allAudioChildren
    }
  }

  if(nodeName === 'text') {
    return {
      nodeName,
      'content': prosemirrorDocument.text
    }
  }

  // handle the attributes
  for (const key in attributes) {
    if (!attributes[key]) {
      delete attributes[key];
    }
  }

  const nodeObject: JDita = {
    nodeName,
    attributes,
    children
  }
  return nodeObject;
}

//Escape hatch for Unit Testing due to a lack of “package-private” accessibility scope in TypeScript
export const _test_private_document = {
  deleteUndefined,
  defaultTravel,
  travel,
};
