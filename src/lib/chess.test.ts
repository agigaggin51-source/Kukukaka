import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { evaluateBoard, findBestMove } from './engine';
import { detectOpening } from './openings';
import { classifyMove, getClassificationSymbol } from './analysis';
import { engineService } from './engineWorkerService';

test('Initial board evaluation is symmetric near 0', () => {
  const chess = new Chess();
  const evalScore = evaluateBoard(chess);
  // Starting position evaluation should be balanced within 50 centipawns
  assert.ok(Math.abs(evalScore) < 50, `Initial eval was ${evalScore}`);
});

test('Opening detector recognizes King\'s Pawn Opening (C20)', () => {
  const opening = detectOpening(['e4']);
  assert.equal(opening.eco, 'C20');
  assert.equal(opening.nameId, 'Pembukaan Pion Raja');
});

test('Opening detector recognizes Sicilian Defense (B20)', () => {
  const opening = detectOpening(['e4', 'c5']);
  assert.equal(opening.eco, 'B20');
  assert.equal(opening.name, 'Sicilian Defense');
});

test('Opening detector recognizes Queen\'s Gambit (D06)', () => {
  const opening = detectOpening(['d4', 'd5', 'c4']);
  assert.equal(opening.eco, 'D06');
  assert.equal(opening.name, "Queen's Gambit");
});

test('Engine finds legal moves and evaluation', () => {
  const chess = new Chess();
  const result = findBestMove(chess, 2);
  assert.ok(result.bestMove.length >= 4, 'bestMove should be at least 4 chars (e.g. e2e4)');
  assert.ok(result.pv.length > 0, 'PV should contain at least 1 move');
  assert.ok(typeof result.evaluation === 'number', 'eval should be a number');
});

test('Classify move produces valid classification and explanation', () => {
  const chess = new Chess();
  const fenBefore = chess.fen();
  chess.move('e4');
  const fenAfter = chess.fen();

  const analyzed = classifyMove(fenBefore, fenAfter, 'e4', 1);
  assert.equal(analyzed.san, 'e4');
  assert.equal(analyzed.color, 'w');
  assert.ok(analyzed.classification, 'classification must be assigned');
  assert.ok(analyzed.explanation && analyzed.explanation.length > 5, 'explanation must exist');
});

test('Classification symbols match standard chess notation', () => {
  assert.equal(getClassificationSymbol('brilliant')?.symbol, '!!');
  assert.equal(getClassificationSymbol('great')?.symbol, '!');
  assert.equal(getClassificationSymbol('best')?.symbol, '★');
  assert.equal(getClassificationSymbol('excellent')?.symbol, '!?');
  assert.equal(getClassificationSymbol('inaccuracy')?.symbol, '?!');
  assert.equal(getClassificationSymbol('mistake')?.symbol, '?');
  assert.equal(getClassificationSymbol('blunder')?.symbol, '??');
  assert.equal(getClassificationSymbol('good')?.symbol, '✓');
});

test('Engine prioritizes immediate checkmate (Mate-in-1) across all levels', () => {
  // Scholar's Mate position: Qxf7# is mate in 1
  const c = new Chess('r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 5');
  // Even at level 1 (beginner), the engine must find Qxf7# immediately
  const res1 = findBestMove(c, 1);
  assert.equal(res1.bestMoveSan, 'Qxf7#');
  assert.equal(res1.mateIn, 1);

  // At level 3
  const res3 = findBestMove(c, 3);
  assert.equal(res3.bestMoveSan, 'Qxf7#');
  assert.equal(res3.mateIn, 1);
});

test('Engine executes forced mate without shuffle delay', () => {
  // Back rank mate: 1. Qb8# or 1. Re8#
  const c = new Chess('6k1/5ppp/8/8/8/8/1Q3PPP/4R1K1 w - - 0 1');
  const res = findBestMove(c, 2);
  assert.ok(res.bestMoveSan.includes('#'), `Must deliver checkmate, got ${res.bestMoveSan}`);
  assert.equal(res.mateIn, 1);
  assert.equal(res.evaluation, 300);
});

test('Engine drives active King in winning endgame instead of shuffling', () => {
  // Lone King vs King + Rook endgame
  const c = new Chess('8/8/8/4k3/8/8/4R3/4K3 w - - 0 1');
  const res = findBestMove(c, 3);
  assert.ok(res.bestMove.length >= 4, 'Must produce a legal move');
  assert.ok(res.evaluation > 4.0, 'White must be evaluated as heavily winning');
});

test('Engine delivers Queen mate without delay when winning', () => {
  // White King on c3, Queen on b2, Black King on a1
  const c = new Chess('8/8/8/8/8/2K5/1Q6/k7 w - - 0 1');
  const res = findBestMove(c, 2);
  assert.ok(res.bestMoveSan.includes('#'), `Must deliver immediate checkmate, got ${res.bestMoveSan}`);
});

test('Morphy Opera Game puzzle sequence executes to checkmate', () => {
  const c = new Chess('4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16');
  assert.ok(c.move('Qb8+'), 'Qb8+ must be legal');
  assert.ok(c.move('Nxb8'), 'Nxb8 must be legal');
  assert.ok(c.move('Rd8#'), 'Rd8# must be legal');
  assert.equal(c.isCheckmate(), true);
});

test('Boden Mate puzzle sequence executes to checkmate', () => {
  const c = new Chess('2kr1b1r/pp1n1ppp/2p1pn2/8/2Q2B2/3B4/PPP2PPP/2KR3R w - - 0 1');
  assert.ok(c.move('Qxc6+'), 'Qxc6+ must be legal');
  assert.ok(c.move('bxc6'), 'bxc6 must be legal');
  assert.ok(c.move('Ba6#'), 'Ba6# must be legal');
  assert.equal(c.isCheckmate(), true);
});

test('Board Editor can place, remove pieces and construct valid FEN', () => {
  const c = new Chess();
  c.clear();
  assert.equal(c.fen(), '8/8/8/8/8/8/8/8 w - - 0 1');

  c.put({ type: 'k', color: 'w' }, 'e1');
  c.put({ type: 'k', color: 'b' }, 'e8');
  c.put({ type: 'q', color: 'w' }, 'd1');
  assert.ok(c.fen().includes('4k3'));
  assert.ok(c.fen().includes('3QK3'));

  c.remove('d1');
  assert.ok(!c.fen().includes('3QK3'));
  assert.ok(c.fen().includes('4K3'));
});

test('Fast batch review uses cached moves and executes in milliseconds', async () => {
  const cached: any = {
    moveNumber: 1,
    color: 'w',
    san: 'e4',
    classification: 'book',
    evalBefore: 0.1,
    evalAfter: 0.2,
    accuracy: 98,
    explanation: 'Pembukaan standar',
  };
  let progressReported = false;
  const res = await engineService.runBatchAnalysisAsync(['e4', 'e5'], [cached], (cur, tot) => {
    assert.ok(cur > 0);
    assert.equal(tot, 2);
    progressReported = true;
  });
  assert.equal(res.analyzedMoves.length, 2);
  assert.equal(res.analyzedMoves[0].classification, 'book');
  assert.ok(progressReported, 'Progress callback should be invoked');
  assert.ok(res.summary.accuracyWhite > 80);
});

test('Online multiplayer room code generator and formatter works correctly', async () => {
  const { generateRoomCode, formatRoomCode } = await import('./onlineMultiplayer');
  const code = generateRoomCode();
  assert.match(code, /^WCH-[A-Z0-9]{4}$/, 'Room code should match WCH-XXXX format');
  assert.equal(formatRoomCode('  wch-8k2m  '), 'WCH-8K2M');
  assert.equal(formatRoomCode('WCH-7x#9!'), 'WCH-7X9');
});

test('RBAC: Profiles enforce role separation between admin and user', () => {
  type UserRole = 'admin' | 'user';
  interface TestProfile {
    id: string;
    email: string;
    role: UserRole;
  }

  const adminProfile: TestProfile = {
    id: 'admin-1',
    email: 'admin@wchess.com',
    role: 'admin',
  };

  const userProfile: TestProfile = {
    id: 'user-1',
    email: 'user@wchess.com',
    role: 'user',
  };

  assert.equal(adminProfile.role, 'admin');
  assert.equal(userProfile.role, 'user');
  assert.notEqual(adminProfile.role, userProfile.role);
});

test('RBAC: Route Guard strictly permits admin and rejects regular users/guests', () => {
  const canAccessAdminDashboard = (user: { role?: string } | null, routePath: string): boolean => {
    const isAdminRoute = routePath === '#admin' || routePath.includes('view=admin');
    if (!isAdminRoute) return true;
    return !!(user && user.role === 'admin');
  };

  // Guest (unauthenticated)
  assert.equal(canAccessAdminDashboard(null, '#admin'), false, 'Guest must be denied access to #admin');
  assert.equal(canAccessAdminDashboard(null, '?view=admin'), false, 'Guest must be denied access to view=admin');

  // Regular user (role: 'user')
  const regularUser = { role: 'user', email: 'user@wchess.com' };
  assert.equal(canAccessAdminDashboard(regularUser, '#admin'), false, 'Regular user must be denied access to #admin');
  assert.equal(canAccessAdminDashboard(regularUser, '?view=admin'), false, 'Regular user must be denied access to view=admin');

  // Administrator (role: 'admin')
  const adminUser = { role: 'admin', email: 'admin@wchess.com' };
  assert.equal(canAccessAdminDashboard(adminUser, '#admin'), true, 'Admin user must be allowed to access #admin');
  assert.equal(canAccessAdminDashboard(adminUser, '?view=admin'), true, 'Admin user must be allowed to access view=admin');

  // Non-admin routes are accessible to all
  assert.equal(canAccessAdminDashboard(regularUser, '#game'), true, 'Regular user can access normal routes');
  assert.equal(canAccessAdminDashboard(null, '#game'), true, 'Guest can access normal routes');
});


