import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authService } from '../services/auth.service';
import { LoginInput, RefreshTokenInput, RegisterInput } from '../validators/auth.validator';

/**
 * Extrai metadados da requisição (dispositivo e IP) para guardar
 * junto da sessão. `req.get('user-agent')` é a forma padrão do
 * Express de ler o cabeçalho User-Agent — não é infalível para
 * identificar "o dispositivo" com precisão, mas é o suficiente para
 * uma futura tela de "sessões ativas" ser útil ao utilizador.
 */
function getSessionContext(req: Request): { device: string | null; ip: string | null } {
  return {
    device: req.get('user-agent') ?? null,
    ip: req.ip ?? null,
  };
}

/**
 * POST /api/auth/register
 *
 * Devolve 201 com os dados do utilizador criado — sem tokens (ver
 * justificativa na explicação deste passo).
 */
const register = asyncHandler(
  async (req: Request<Record<string, string>, unknown, RegisterInput>, res: Response) => {
    const user = await authService.register(req.body);

    res.status(201).json({
      status: 'success',
      data: user,
    });
  }
);

/**
 * POST /api/auth/login
 *
 * Devolve o utilizador autenticado junto com o par de tokens. O
 * status 200 (não 201) é intencional: login não CRIA um recurso do
 * ponto de vista REST, apenas autentica algo que já existe.
 */
const login = asyncHandler(
  async (req: Request<Record<string, string>, unknown, LoginInput>, res: Response) => {
    const result = await authService.login(req.body, getSessionContext(req));

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

/**
 * POST /api/auth/refresh
 *
 * Troca um refresh token válido por um novo par de tokens (rotação).
 * O cliente deve substituir IMEDIATAMENTE o refresh token antigo
 * pelo novo devolvido aqui — o antigo já foi invalidado no service.
 */
const refresh = asyncHandler(
  async (req: Request<Record<string, string>, unknown, RefreshTokenInput>, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken, getSessionContext(req));

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

/**
 * POST /api/auth/logout
 *
 * 204 sem corpo — mesmo padrão já usado em category.controller.ts
 * para operações que só "removem" algo, sem dado útil para devolver.
 */
const logout = asyncHandler(
  async (req: Request<Record<string, string>, unknown, RefreshTokenInput>, res: Response) => {
    await authService.logout(req.body.refreshToken);

    res.status(204).send();
  }
);

export const authController = {
  register,
  login,
  refresh,
  logout,
};
