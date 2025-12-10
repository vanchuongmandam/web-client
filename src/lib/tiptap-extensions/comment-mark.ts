
import Highlight from '@tiptap/extension-highlight';

export const CommentMark = Highlight.extend({
    addAttributes() {
        return {
            comment: {
                default: null,
                parseHTML: element => element.getAttribute('data-comment'),
                renderHTML: attributes => {
                    if (!attributes.comment) {
                        return {}
                    }
                    return {
                        'data-comment': attributes.comment,
                        'class': 'cursor-pointer border-b-2 border-yellow-400 bg-yellow-100 dark:bg-yellow-900/30', // Custom styling
                        'title': attributes.comment // Simple tooltip
                    }
                },
            },
            color: {
                default: null,
                parseHTML: element => element.getAttribute('data-color'),
                renderHTML: attributes => {
                    if (!attributes.color) {
                        return {}
                    }
                    return {
                        'data-color': attributes.color,
                        style: `background-color: ${attributes.color}; color: inherit`,
                    }
                },
            },
        }
    },
});
