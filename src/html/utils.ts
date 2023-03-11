import path from "node:path"
import os from "node:os"

// sourcecode from vite
// export const isWindows = os.platform() === 'win32'
export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizePath(id: string): string {
  return path.posix.normalize(os.platform() === 'win32' ? slash(id) : id)
}

// end
