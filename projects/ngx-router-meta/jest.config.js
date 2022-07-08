module.exports = {
  globals: {
    'ts-jest': {
      // TS throws warnings when module=es2015|esnext is used
      // @see https://github.com/kulshekhar/ts-jest/issues/748
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
  },
};
