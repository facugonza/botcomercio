import { addKeyword, EVENTS } from '@builderbot/bot';
import axios from "axios";
import databaseLogger from '../logger/databaseLogger';
import acciones from '../models/actions';

// Función para asociar el comercio usando los datos proporcionados
const asociarComercio = async (datosComercio: any) => {
  try {
    console.log("asociarComercio DATOS: " + JSON.stringify(datosComercio));

    const config = {
      method: "POST",
      url: "http://200.70.56.203:8021/AppMovil/ValidarComercio", // Cambiado a la URL correcta para validar comercio
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
    ["¡Claro! Antes de continuar, necesito validar el número de comercio. ¿Podrías proporcionármelo, por favor?"],
    { capture: true },
    async (ctx, { fallBack, state }) => {
      state.clear();
      await state.update({ telefono: ctx.from });
      console.log("flowValidarComercio > Número de Comercio: " + ctx.body);
      const comercioRegex = /^\d+$/;
      if (comercioRegex.test(ctx.body)) {
        await state.update({ numeroComercio: ctx.body });
      } else {
        return fallBack(
          "¿Podrías verificar el número de comercio ingresado? Gracias."
        );
      }
    }
  )
  .addAnswer(
    "¡Perfecto! Ahora necesito el CUIT del comercio. ¿Podrías proporcionármelo, por favor?",
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
    "¡Gracias! Por último, necesito la contraseña del usuario del comercio. ¿Podrías proporcionármela, por favor?",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      console.log("flowValidarComercio > Contraseña: " + ctx.body);
      if (ctx.body && ctx.body.length > 0) { // Verifica que la contraseña no esté vacía
        await state.update({ password: ctx.body });
      } else {
        return fallBack(
          "¿Podrías verificar la contraseña ingresada? Gracias."
        );
      }
    }
  )
  .addAnswer("¡Muchas gracias! Un momento por favor... Estoy validando tus datos.",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
      const comercio = await asociarComercio(state.getMyState());
      console.log("flowValidarComercio último addAnswer: " + comercio);        
      if (comercio != null && comercio.isLogin) {
        
        databaseLogger.addLog(
          comercio.numeroComercio,
          acciones.VINCULAR
        );
    
        await flowDynamic("¡Felicitaciones! Hemos asociado este número (*+" + ctx.from + "*) al comercio: " + comercio.descripcion + " (CUIT: " + comercio.cuit + "). ¡Gracias por registrarte!");
        return endFlow("Por favor, envía un mensaje nuevamente para iniciar como comercio registrado.");
      } else {
        return endFlow("La información proporcionada no coincide con nuestros registros. Por favor, verifica la información e inténtalo de nuevo.");
      }
    }
  );

export default flowValidarComercio;
