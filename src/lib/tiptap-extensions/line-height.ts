// src/lib/tiptap-extensions/line-height.ts
import { Extension } from '@tiptap/core';

// Định nghĩa các mức giãn dòng hợp lệ
export const LINE_HEIGHTS = ['1', '1.5', '2', '2.5'];

// Khai báo kiểu dữ liệu để TypeScript hiểu thuộc tính mới
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

// Tạo extension
export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['heading', 'paragraph'], // Chỉ áp dụng cho tiêu đề và đoạn văn
      defaultLineHeight: '1.5',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: element => element.style.lineHeight,
            renderHTML: attributes => {
              if (attributes.lineHeight === this.options.defaultLineHeight) {
                return {};
              }
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        if (!LINE_HEIGHTS.includes(lineHeight)) {
          return false;
        }
        return this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight }));
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every((type: string) => commands.resetAttributes(type, 'lineHeight'));
      },
    };
  },
});

export default LineHeight;
