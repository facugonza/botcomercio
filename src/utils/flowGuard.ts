const PALABRAS_SALIDA = ['cancelar', 'salir', 'menu', 'volver', 'cancel', 'exit', 'no quiero', 'dejalo'];
const MAX_INTENTOS = 3;
const MSG_CANCELADO = 'Proceso cancelado. Si necesitás algo más, escribime cuando quieras.';
const MSG_MAX_INTENTOS = 'Demasiados intentos fallidos. Cancelando el proceso. Si necesitás ayuda, escribime nuevamente.';

/**
 * Verifica si el usuario quiere salir del flujo o superó el límite de intentos.
 * @returns true si debe salir (ya llamó a endFlow), false si puede continuar
 */
const checkEscape = async (
    ctx: any,
    state: any,
    endFlow: any,
    stepKey: string = 'intentos'
): Promise<boolean> => {
    // Verificar palabra de salida
    const msg = ctx.body.trim().toLowerCase();
    if (PALABRAS_SALIDA.some(p => msg.includes(p))) {
        await endFlow(MSG_CANCELADO);
        return true;
    }

    // Verificar máximo de intentos
    const intentos = (state.get(stepKey) || 0) + 1;
    await state.update({ [stepKey]: intentos });
    if (intentos > MAX_INTENTOS) {
        await endFlow(MSG_MAX_INTENTOS);
        return true;
    }

    return false;
};

export { checkEscape };
