export const settings = {
  formatOnSave: {
    title: 'Format Files on Save',
    description: 'Automatically format entire file when saving.',
    type: 'boolean',
    default: false,
    order: 1
  },
  indentSize: {
    title: 'Indent Size',
    description: 'Number of spaces used to represent an indentation.',
    type: 'number',
    default: 2,
    order: 2
  },
  indentType: {
    title: 'Indent Type',
    description: 'Determine chracter used for indentation.',
    type: 'string',
    enum: ['tab', 'space'],
    default: 'tab',
    order: 3
  },
  backup: {
    title: 'Backup',
    description:
      'Beautysh will create a backup file in the same path as the original.',
    type: 'boolean',
    default: false,
    order: 4
  }
};
