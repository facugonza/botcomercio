import { addKeyword, EVENTS } from '@builderbot/bot';
import axios from "axios";
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';
import { checkEscape } from '../utils/flowGuard';

// Función para asociar el comercio usando los datos proporcionados
const asociarComercio = async (datosComercio: any) => {
  try {
    console.log("asociarComercio DATOS: " + JSON.stringify(datosComercio));
    databaseLogger.addLog(
      datosComercio.numeroComercio,
      acciones.VINCULAR
    );

    const config = {
      method: "POST",
      url: `${process.env.API_BASE_URL}/AppMovil/ValidarComercio`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(datosComercio),
    };

    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log("asociarComercio > ERROR: " + e);
    return null;
  }
};

// Flujo para validar comercio
const flowValidarComercio = addKeyword("vincular", { sensitive: false })
  .addAnswer(
    ["¡Claro! Vamos a vincular tu comercio. En cualquier momento podés escribir *cancelar* para salir.\n\nNecesito el número de comercio:"],
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      state.clear();
      await state.update({ telefono: ctx.from });
      if (await checkEscape(ctx, state, endFlow, 'intentos_nro')) return;
      const comercioRegex = /^\d+$/;
      if (comercioRegex.test(ctx.body)) {
        await state.update({ numeroComercio: ctx.body });
      } else {
        return fallBack("¿Podrías verificar el número de comercio? Debe ser solo números. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer(
    "Ahora necesito el CUIT del comercio (11 dígitos sin guiones):",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_cuit')) return;
      const cuitRegex = /^\d{11}$/;
      if (cuitRegex.test(ctx.body)) {
        await state.update({ cuit: ctx.body });
      } else {
        return fallBack("¿Podrías verificar el CUIT? Debe tener 11 dígitos. Escribí *cancelar* para salir.");
      }
    }
  )
  /*
  .addAnswer(
    "¡Perfecto! Ahora necesito el usuario registrado en Dpto Comercios. ¿Podrías proporcionármelo, por favor?",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      console.log("flowValidarComercio > CUIT: " + ctx.body);
      const cuitRegex = /^\d{11}$/; // El CUIT debe tener 11 dígitos
      if (cuitRegex.test(ctx.body)) {
        await state.update({ cuit: ctx.body });
      } else {
        return fallBack(
          "¿Podrías verificar el CUIT ingresado? Debe ser un número de 11 dígitos. Gracias."
        );
      }
    }
  )
    */
  .addAnswer(
    "Por último, la contraseña del usuario del comercio:",
    { capture: true },
    async (ctx, { fallBack, endFlow, state }) => {
      if (await checkEscape(ctx, state, endFlow, 'intentos_pass')) return;
      if (ctx.body && ctx.body.length > 0) {
        await state.update({ password: ctx.body });
      } else {
        return fallBack("¿Podrías ingresar la contraseña? No puede estar vacía. Escribí *cancelar* para salir.");
      }
    }
  )
  .addAnswer("¡Muchas gracias! Un momento por favor... Estoy validando tus datos.",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
      const comercio = await asociarComercio(state.getMyState());
      console.log("flowValidarComercio último addAnswer: " + comercio);        
      if (comercio != null && comercio.isLogin) {
        await flowDynamic("¡Felicitaciones! Hemos asociado este número (*+" + ctx.from + "*) al comercio: " + comercio.descripcion + " (CUIT: " + comercio.cuit + "). ¡Gracias por registrarte!");
        return endFlow("Por favor, envía un mensaje nuevamente para iniciar como comercio registrado.");
      } else {
        return endFlow("La información proporcionada no coincide con nuestros registros. Por favor, verifica la información e inténtalo de nuevo.");
      }
    }
  );

export default flowValidarComercio;
