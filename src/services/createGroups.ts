import axios from 'axios';

// Definir los tipos para los parámetros de la función
interface CreateGroupParams {
  numeroTelefono: string;
  whatsappId: string;
  groupCode: string;
  comercioCUIT: string; // Cambié clienteDNI a comercioCUIT para reflejar mejor el contexto del comercio
}

// Función para crear un grupo de WhatsApp y enviar la solicitud al servidor
const createGroup = async ({ numeroTelefono, whatsappId, groupCode, comercioCUIT }: CreateGroupParams): Promise<any> => {
  const params = new URLSearchParams({
    nroTelefono: numeroTelefono,
    whatsappId: whatsappId,
    groupCode: groupCode,
    comercioCUIT: comercioCUIT
  });

  const url = `http://200.70.56.203:8021/AppMovil/GroupsController?${params.toString()}`;
  console.log('URL de solicitud:', url);

  try {
    const response = await axios.post(url);
    console.log('Respuesta del servidor:', response.data);
    return response.data; // Retorna los datos de la respuesta
  } catch (error) {
    console.error('Error al realizar la petición:', error);
    throw error; // Lanza el error para manejarlo más adelante si es necesario
  }
};

export default createGroup;
