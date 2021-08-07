class ArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = "ArgumentError";
      }
}

exports.ArgumentError = ArgumentError;