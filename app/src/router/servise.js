import { Elysia } from 'elysia';
import { success, fail } from '../utils/response.js';
const app = new Elysia();

app.get('/servise/:serverCode', async (ctx) => {
  const { serverCode } = ctx.params;

  const response = await fetch('http://xxx:8682/v2/api-docs');
  const data = await response.json();
  const tag = data.tags.find((item) => {
    return item.description.indexOf(`${serverCode} `) >= 0;
  });
  const path = Object.keys(data.paths).find((i) => {
    return data.paths[i].post.summary === tag.description;
  });

  const { parameters, responses } = data.paths[path].post;
  const raw = {
    request: parameters[0],
    response: responses['200'],
  };

  const requestDTO = toDTO(raw.request.schema.$ref);
  const responseDTO = toDTO(raw.response.schema.$ref);

  function toDTO(ref) {
    if (!ref) return {};
    ref = ref.replace('#/definitions/', '');
    const dto = data.definitions[ref].properties;
    const arr = Object.keys(dto);
    arr.map((filed) => {
      if (!['page', 'sessionContext', 'transactionStatus'].includes(filed)) {
        let item = dto[filed];
        if (item.$ref) {
          item = toDTO(item.$ref);
        }
        if (item.type === 'array' && item.items.$ref) {
          item.items = toDTO(item.items.$ref);
          item.type = 'array';
        }
        dto[filed] = item;
      } else {
        delete dto[filed];
      }
    });
    return dto;
  }

  function getItemString(item) {
    let text = '';
    switch (item.type) {
      case 'array':
        item.items = getItemString(item.items);
        text = `${item.type}<${item.items}>`;
        return text;
      default:
        return item.type;
    }
  }

  const requestText =
    `reponse:{` +
    Object.entries(requestDTO)
      .map(([field, item]) => `${field}: ${item.type};`)
      .join('\n') +
    '\n}';

  let responseText = `request:{`;
  Object.entries(responseDTO).map(([field, item]) => {
    responseText += `${field}: ${getItemString(item)};`;
  });

  return success(ctx, {
    requestText: requestText,
    responseText: responseText,
    request: requestDTO,
    response: responseDTO,
    tag: tag,
    raw: raw,
  });
});

export default app;
