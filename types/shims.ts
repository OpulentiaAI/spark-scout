// Minimal module shims to satisfy type checking in CI environments
// where type packages may not be available. These should be replaced
// by concrete types if stricter checking is desired.

// Resend SDK (runtime dependency ships types, but shim guards TS in slim envs)
declare module 'resend' {
  export class Resend {
    constructor(apiKey: string);
    emails: { send(input: any): Promise<any> };
  }
}

// browser-image-compression (runtime dependency ships types; shim as fallback)
declare module 'browser-image-compression' {
  type Options = Record<string, any>;
  function imageCompression(file: File, options?: Options): Promise<Blob | File>;
  export default imageCompression;
}

