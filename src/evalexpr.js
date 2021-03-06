
import { STRINGS, EVLVARS } from './revars'

// For replacing of jspreproc variables ($1 = prefix, $2 = varname)
const _REPVARS = RegExp(`${STRINGS.source}|${EVLVARS.source}`, 'g')

// For split arguments of macros
const _SPLITARGS = /\s*,\s*/g

/**
 * Method to perform the evaluation of the received string using
 * a function instantiated dynamically.
 *
 * @param   {object} ctx - Object with the current set of variables
 * @param   {string} str - String to evaluate, can include other defined vars
 * @param   {string} [macro] - Optional as macro
 * @returns {any}          The result.
 */
export default function evalExpr (ctx, str, macro) {
  const values = ctx.options.values

  let result

  if (macro) {

    const args = macro.split(_SPLITARGS)
    // eslint-disable-next-line no-new-func
    result = function (argsToReplace) {
      if (args.length !== argsToReplace.length) {
        throw new Error('Argumentlength mismatch')
      }
      let regex, expr = str
      for (let i = 0; i < args.length; i++) {
        regex = RegExp(args[i], 'g')
        expr = expr.replace(regex, argsToReplace[i])
      }
      return expr
    }

  } else {

    // var replacement
    const _repVars = function (m, p, v) {
      return v
        ? p + (v in values ? `this.${v}` : v in global ? `global.${v}` : 'undefined')
        : m
    }

    const expr = str
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(_REPVARS, _repVars)

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('', `return (${expr});`)
      result = fn.call(values)
    } catch (e) {
      result = false
      ctx._emitError(`${e.message} in expression "${expr}"`)
    }

  }

  return result
}
