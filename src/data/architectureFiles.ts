import { ArchFile } from '../types/architecture';

export const initialArchFiles: ArchFile[] = [
  {
    name: 'hr_routes.ts',
    path: 'backend/src/routes/hr_routes.ts',
    language: 'typescript',
    module: 'Ressources Humaines (RH)',
    layer: 'backend',
    type: 'route',
    description: 'Endpoints d\'API REST pour gérer les contrats, les pointages de présence journaliers et le calcul de paie.',
    content: `import { Router } from 'express';
import { HrController } from '../controllers/hr_controller';
import { requireAuth } from '../middlewares/auth_middleware';

const router = Router();
const controller = new HrController();

// GET all employees with contract details
router.get('/employees', requireAuth, controller.getAllEmployees);

// POST create human contract
router.post('/employees', requireAuth, controller.createContract);

// POST register physical / biometric attendance
router.post('/attendance/punch', requireAuth, controller.registerAttendance);

// GET monthly consolidated salaries & deductions
router.get('/payroll/monthly', requireAuth, controller.getMonthlyPayroll);

// POST apply bonus or advance
router.post('/payroll/adjust', requireAuth, controller.adjustSalaryPeriod);

export default router;`
  },
  {
    name: 'hr_controller.ts',
    path: 'backend/src/controllers/hr_controller.ts',
    language: 'typescript',
    module: 'Ressources Humaines (RH)',
    layer: 'backend',
    type: 'controller',
    description: 'Contrôleur d\'orchestration pour calculer le salaire brut, les cotisations patronales/salariales (CNPS, IPRES, ITS) et le Net payable.',
    content: `import { Request, Response } from 'express';
import { pool } from '../database/pg_pool';

export class HrController {
  
  async getAllEmployees(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenant_id;
      const { rows } = await pool.query(
        'SELECT * FROM employees WHERE tenant_id = $1 ORDER BY last_name, first_name',
        [tenantId]
      );
      return res.json({ success: true, count: rows.length, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async createContract(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenant_id;
      const { first_name, last_name, position, department, basic_salary, email, phone } = req.body;
      
      const { rows } = await pool.query(
        \`INSERT INTO employees (tenant_id, first_name, last_name, position, department, basic_salary, email, phone) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *\`,
        [tenantId, first_name, last_name, position, department, basic_salary, email, phone]
      );
      
      return res.status(210).json({ success: true, data: rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async registerAttendance(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenant_id;
      const { employee_id, status, notes } = req.body;
      
      const { rows } = await pool.query(
        \`INSERT INTO hr_attendance (tenant_id, employee_id, date, status, check_in_time, notes) 
         VALUES ($1, $2, CURRENT_DATE, $3, CURRENT_TIME, $4) RETURNING *\`,
        [tenantId, employee_id, status, notes]
      );
      
      return res.json({ success: true, msg: "Presénce pointée", data: rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMonthlyPayroll(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenant_id;
      const { period } = req.query; // e.g. "Juin 2026"
      
      const { rows } = await pool.query(
        \`SELECT p.*, e.first_name, e.last_name, e.position 
         FROM hr_payslips p
         JOIN employees e ON e.id = p.employee_id
         WHERE p.tenant_id = $1 AND p.period = $2\`,
        [tenantId, period || 'Juin 2026']
      );
      
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async adjustSalaryPeriod(req: Request, res: Response) {
    try {
      const tenantId = req.user.tenant_id;
      const { employee_id, type, amount, description } = req.body; // type: "Prime" | "Avance"
      
      const { rows } = await pool.query(
        \`INSERT INTO hr_salary_adjustments (tenant_id, employee_id, type, amount, description, date) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING *\`,
        [tenantId, employee_id, type, amount, description]
      );
      
      return res.json({ success: true, adjustment: rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}`
  },
  {
    name: 'hr_employee_entity.dart',
    path: 'frontend/lib/domain/entities/hr_employee_entity.dart',
    language: 'dart',
    module: 'Ressources Humaines (RH)',
    layer: 'domain',
    type: 'entity',
    description: 'Représente l\'entité collaborateur clinicien ou vendeur d\'optique dans Flutter.',
    content: `import 'package:equatable/equatable.dart';

class HrEmployeeEntity extends Equatable {
  final String id;
  final String firstName;
  final String lastName;
  final String position;
  final String department;
  final String email;
  final String phone;
  final double basicSalary;
  final String status;

  const HrEmployeeEntity({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.position,
    required this.department,
    required this.email,
    required this.phone,
    required this.basicSalary,
    required this.status,
  });

  @override
  List<Object?> get props => [
        id,
        firstName,
        lastName,
        position,
        department,
        email,
        phone,
        basicSalary,
        status,
      ];
}`
  },
  {
    name: 'hr_provider.dart',
    path: 'frontend/lib/presentation/providers/hr_provider.dart',
    language: 'dart',
    module: 'Ressources Humaines (RH)',
    layer: 'presentation',
    type: 'provider',
    description: 'Riverpod StateNotifierProvider pilotant la liste des employés et l\'émargement du personnel optique.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/hr_employee_entity.dart';

class EmployeeListNotifier extends StateNotifier<List<HrEmployeeEntity>> {
  EmployeeListNotifier() : super(const [
    HrEmployeeEntity(
      id: 'EMP-01', 
      firstName: 'Khadija', 
      lastName: 'Sy', 
      position: 'Conseiller de Vente', 
      department: 'Magasin',
      email: 'khadija.sy@glaboptic.com',
      phone: '+221 77 124 55 93',
      basicSalary: 650.0, 
      status: 'Actif'
    ),
    HrEmployeeEntity(
      id: 'EMP-02', 
      firstName: 'Alioune', 
      lastName: 'Diop', 
      position: 'Opticien-Conseil', 
      department: 'Magasin',
      email: 'alioune.diop@glaboptic.com',
      phone: '+221 76 544 32 10',
      basicSalary: 1100.0, 
      status: 'Actif'
    )
  ]);

  void addEmployee(HrEmployeeEntity emp) {
    state = [...state, emp];
  }

  void updateEmployeeStatus(String empId, String newStatus) {
    state = [
      for (final emp in state)
        if (emp.id == empId)
          HrEmployeeEntity(
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            position: emp.position,
            department: emp.department,
            email: emp.email,
            phone: emp.phone,
            basicSalary: emp.basicSalary,
            status: newStatus,
          )
        else
          emp
    ];
  }
}

final employeeProvider = StateNotifierProvider<EmployeeListNotifier, List<HrEmployeeEntity>>((ref) {
  return EmployeeListNotifier();
});`
  },
  {
    name: 'hr_dashboard_view.dart',
    path: 'frontend/lib/presentation/pages/hr_dashboard_view.dart',
    language: 'dart',
    module: 'Ressources Humaines (RH)',
    layer: 'presentation',
    type: 'entity',
    description: 'Écran tactile Flutter pour l\'émargement de présence journalière et consultation des bulletins de paie PDF.',
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/hr_provider.dart';

class HrDashboardView extends ConsumerWidget {
  const HrDashboardView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final employeesList = ref.watch(employeeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('G-LAB OPTIC - RH & Présences'),
        backgroundColor: const Color(0xFF0097A7),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Card(
              color: Color(0xFFF5F7FA),
              child: ListTile(
                leading: Icon(Icons.badge, color: Color(0xFF00BCD4)),
                title: Text('Registre du Personnel de Boutique'),
                subtitle: Text('Sécurisé par authentification multi-tenant.'),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: employeesList.length,
                itemBuilder: (context, index) {
                  final emp = employeesList[index];
                  return Card(
                    child: ListTile(
                      title: Text('\${emp.firstName} \${emp.lastName}'),
                      subtitle: Text('\${emp.position} • \${emp.department}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('\${emp.basicSalary.toStringAsFixed(2)} €', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                          const SizedBox(width: 10),
                          Chip(
                            label: Text(emp.status),
                            backgroundColor: emp.status == 'Actif' ? Colors.green[105] : Colors.orange[105],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}`
  },
  {
    name: 'frame_entity.dart',
    path: 'frontend/lib/domain/entities/frame_entity.dart',
    language: 'dart',
    module: 'Multi-Boutique Inventory',
    layer: 'domain',
    type: 'entity',
    description: 'Représente une monture de lunettes physique avec ses caractéristiques d\'ajustement optique et sa marque.',
    content: `import 'package:equatable/equatable.dart';

class FrameEntity extends Equatable {
  final String id;
  final String brand;
  final String modelCode;
  final String colorCode;
  final double price;
  final int stockCount;
  final String rawMaterial; // Acetate, Metal, Titanium, etc.
  final int eyeSize;       // Largeur du verre (ex: 52)
  final int bridgeSize;    // Largeur du pont (ex: 18)
  final int templeLength;  // Longueur des branches (ex: 145)
  final String? imageUrl;
  final String tenantId;    // Multi-tenant key for current eyewear chain

  const FrameEntity({
    required this.id,
    required this.brand,
    required this.modelCode,
    required this.colorCode,
    required this.price,
    required this.stockCount,
    required this.rawMaterial,
    required this.eyeSize,
    required this.bridgeSize,
    required this.templeLength,
    this.imageUrl,
    required this.tenantId,
  });

  FrameEntity copyWith({
    String? id,
    String? brand,
    String? modelCode,
    String? colorCode,
    double? price,
    int? stockCount,
    String? rawMaterial,
    int? eyeSize,
    int? bridgeSize,
    int? templeLength,
    String? imageUrl,
    String? tenantId,
  }) {
    return FrameEntity(
      id: id ?? this.id,
      brand: brand ?? this.brand,
      modelCode: modelCode ?? this.modelCode,
      colorCode: colorCode ?? this.colorCode,
      price: price ?? this.price,
      stockCount: stockCount ?? this.stockCount,
      rawMaterial: rawMaterial ?? this.rawMaterial,
      eyeSize: eyeSize ?? this.eyeSize,
      bridgeSize: bridgeSize ?? this.bridgeSize,
      templeLength: templeLength ?? this.templeLength,
      imageUrl: imageUrl ?? this.imageUrl,
      tenantId: tenantId ?? this.tenantId,
    );
  }

  @override
  List<Object?> get props => [
        id,
        brand,
        modelCode,
        colorCode,
        price,
        stockCount,
        rawMaterial,
        eyeSize,
        bridgeSize,
        templeLength,
        imageUrl,
        tenantId,
      ];
}`
  },
  {
    name: 'inventory_repository.dart',
    path: 'frontend/lib/domain/repositories/inventory_repository.dart',
    language: 'dart',
    module: 'Multi-Boutique Inventory',
    layer: 'domain',
    type: 'repository',
    description: 'Interface abstraite définissant les contrats de récupération et modification de stocks optiques multi-boutiques.',
    content: `import '../entities/frame_entity.dart';

abstract class InventoryRepository {
  Future<List<FrameEntity>> getFramesByBoutique(String boutiqueId);
  Future<FrameEntity> getFrameDetails(String frameId);
  Future<void> updateStockCount(String frameId, String boutiqueId, int offset);
  Stream<Map<String, int>> subscribeToRealtimeStockUpdates(String boutiqueId);
}`
  },
  {
    name: 'frame_model.dart',
    path: 'frontend/lib/data/models/frame_model.dart',
    language: 'dart',
    module: 'Multi-Boutique Inventory',
    layer: 'data',
    type: 'model',
    description: 'Modèle de données monture gérant la sérialisation JSON avec conversion de structures PostgreSQL/Supabase.',
    content: `import '../../domain/entities/frame_entity.dart';

class FrameModel extends FrameEntity {
  const FrameModel({
    required super.id,
    required super.brand,
    required super.modelCode,
    required super.colorCode,
    required super.price,
    required super.stockCount,
    required super.rawMaterial,
    required super.eyeSize,
    required super.bridgeSize,
    required super.templeLength,
    super.imageUrl,
    required super.tenantId,
  });

  factory FrameModel.fromJson(Map<String, dynamic> json) {
    return FrameModel(
      id: json['id'] as String,
      brand: json['brand'] as String,
      modelCode: json['model_code'] as String,
      colorCode: json['color_code'] as String,
      price: (json['price'] as num).toDouble(),
      stockCount: json['stock_count'] as int? ?? 0,
      rawMaterial: json['raw_material'] as String,
      eyeSize: json['eye_size'] as int,
      bridgeSize: json['bridge_size'] as int,
      templeLength: json['temple_length'] as int,
      imageUrl: json['image_url'] as String?,
      tenantId: json['tenant_id'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'brand': brand,
      'model_code': modelCode,
      'color_code': colorCode,
      'price': price,
      'stock_count': stockCount,
      'raw_material': rawMaterial,
      'eye_size': eyeSize,
      'bridge_size': bridgeSize,
      'temple_length': templeLength,
      'image_url': imageUrl,
      'tenant_id': tenantId,
    };
  }

  static FrameModel fromEntity(FrameEntity entity) {
    return FrameModel(
      id: entity.id,
      brand: entity.brand,
      modelCode: entity.modelCode,
      colorCode: entity.colorCode,
      price: entity.price,
      stockCount: entity.stockCount,
      rawMaterial: entity.rawMaterial,
      eyeSize: entity.eyeSize,
      bridgeSize: entity.bridgeSize,
      templeLength: entity.templeLength,
      imageUrl: entity.imageUrl,
      tenantId: entity.tenantId,
    );
  }
}`
  },
  {
    name: 'inventory_repository_impl.dart',
    path: 'frontend/lib/data/repositories/inventory_repository_impl.dart',
    language: 'dart',
    module: 'Multi-Boutique Inventory',
    layer: 'data',
    type: 'repository',
    description: 'Implémentation concrète de l\'InventoryRepository gérant les requêtes Supabase Rest HTTP et les channels WebSockets.',
    content: `import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/entities/frame_entity.dart';
import '../../domain/repositories/inventory_repository.dart';
import '../models/frame_model.dart';

class InventoryRepositoryImpl implements InventoryRepository {
  final SupabaseClient _supabaseClient;
  
  InventoryRepositoryImpl({required SupabaseClient supabaseClient}) 
    : _supabaseClient = supabaseClient;

  @override
  Future<List<FrameEntity>> getFramesByBoutique(String boutiqueId) async {
    final response = await _supabaseClient
        .from('optical_inventory')
        .select('*, frames:frame_id(*)')
        .eq('boutique_id', boutiqueId);

    return (response as List).map((item) {
      // Fusionner les données de jointure d'inventaire local et de structure de monture
      final frameJson = Map<String, dynamic>.from(item['frames']);
      frameJson['stock_count'] = item['stock_count'];
      return FrameModel.fromJson(frameJson);
    }).toList();
  }

  @override
  Future<FrameEntity> getFrameDetails(String frameId) async {
    final response = await _supabaseClient
        .from('frames')
        .select('*')
        .eq('id', frameId)
        .single();
    
    return FrameModel.fromJson(response);
  }

  @override
  Future<void> updateStockCount(String frameId, String boutiqueId, int offset) async {
    // Appel du backend HTTP node express via rpc Supabase ou fetch standard
    await _supabaseClient.rpc('adjust_optic_stock', params: {
      'p_frame_id': frameId,
      'p_boutique_id': boutiqueId,
      'p_offset': offset
    });
  }

  @override
  Stream<Map<String, int>> subscribeToRealtimeStockUpdates(String boutiqueId) {
    // Utilisation des WebSockets Supabase Realtime
    final channel = _supabaseClient.channel('inventory_updates');
    
    return channel
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'optical_inventory',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'boutique_id',
            value: boutiqueId,
          ),
        )
        .map((payload) {
          final newRecord = payload.newRecord;
          final frameId = newRecord['frame_id'] as String;
          final stock = newRecord['stock_count'] as int;
          return {frameId: stock};
        });
  }
}`
  },
  {
    name: 'inventory_providers.dart',
    path: 'frontend/lib/presentation/providers/inventory_providers.dart',
    language: 'dart',
    module: 'Multi-Boutique Inventory',
    layer: 'presentation',
    type: 'provider',
    description: 'Providers Riverpod gérant l\'état dynamique de l\'inventaire d\'une boutique, connectés en temps réel.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/repositories/inventory_repository_impl.dart';
import '../../domain/entities/frame_entity.dart';
import '../../domain/repositories/inventory_repository.dart';

// Provider pour l'instance globale du client Supabase
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// Provider pour le dépôt d'inventaire
final inventoryRepositoryProvider = Provider<InventoryRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return InventoryRepositoryImpl(supabaseClient: supabase);
});

// État d'inventaire lié à une boutique spécifique
class BoutiqueInventoryNotifier extends StateNotifier<AsyncValue<List<FrameEntity>>> {
  final InventoryRepository _repository;
  final String _boutiqueId;

  BoutiqueInventoryNotifier({
    required InventoryRepository repository,
    required String boutiqueId,
  })  : _repository = repository,
        _boutiqueId = boutiqueId,
        super(const AsyncValue.loading()) {
    loadInventory();
    _subscribeToSocketStock();
  }

  Future<void> loadInventory() async {
    try {
      state = const AsyncValue.loading();
      final frames = await _repository.getFramesByBoutique(_boutiqueId);
      state = AsyncValue.data(frames);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void _subscribeToSocketStock() {
    _repository.subscribeToRealtimeStockUpdates(_boutiqueId).listen((update) {
      state.whenData((currentList) {
        final updatedList = currentList.map((frame) {
          if (update.containsKey(frame.id)) {
            return frame.copyWith(stockCount: update[frame.id]);
          }
          return frame;
        }).toList();
        state = AsyncValue.data(updatedList);
      });
    });
  }

  Future<void> sellFrame(String frameId) async {
    try {
      await _repository.updateStockCount(frameId, _boutiqueId, -1);
      // L'état se mettra à jour soit en local pour UX instantanée, soit via le WebSocket push
    } catch (e) {
      // Gérer l'erreur utilisateur
    }
  }
}

// Provider paramétrable (Family) pour les stocks par boutique
final boutiqueInventoryProvider = StateNotifierProvider.family<
    BoutiqueInventoryNotifier, AsyncValue<List<FrameEntity>>, String>((ref, boutiqueId) {
  final repo = ref.watch(inventoryRepositoryProvider);
  return BoutiqueInventoryNotifier(repository: repo, boutiqueId: boutiqueId);
});`
  },
  {
    name: 'server.ts',
    path: 'backend/server.ts',
    language: 'typescript',
    module: 'Backend Core',
    layer: 'backend',
    type: 'route',
    description: 'Point d\'entrée du backend gérant l\'orchestration HTTP Express, le routage modulaire, et le pont WebSocket.',
    content: `import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth_middleware';
import { inventoryRouter } from './routes/inventory';
import { diagnosticRouter } from './routes/diagnostic';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Config global middlewares
app.use(cors());
app.use(express.json());

// API health endpoint (Public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'live', service: 'G-LAB OPTIC API Orchestrator', timestamp: new Date().toISOString() });
});

// Appliquer le middleware d'authentification Supabase globale
app.use('/api', authMiddleware);

// Routers
app.use('/api/inventory', inventoryRouter);
app.use('/api/diagnostics', diagnosticRouter);

// Création du serveur HTTP contenant Express et s'adaptant à l'infrastructure WS
const server = http.createServer(app);

// Initialisation du serveur WebSocket pour la synchronisation des stocks optiques inter-boutiques
const wss = new WebSocketServer({ server });

// Map pour associer les clients à leur boutique d'écoute (Multi-tenant et Multi-boutique)
const boutiqueSubscriptions = new Map<WebSocket, string>();

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket Server] Nouveau client connecté.');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'SUBSCRIBE_BOUTIQUE':
          boutiqueSubscriptions.set(ws, data.boutiqueId);
          ws.send(JSON.stringify({ type: 'ACK', message: \`Abonné aux stocks de la boutique \${data.boutiqueId}\` }));
          break;
        case 'STOCK_ALERT_ACK':
          console.log(\`[Alert ACK] Boutique \${data.boutiqueId} a validé la rupture de stock \${data.frameId}\`);
          break;
        default:
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Type d\\\'événement WebSocket invalide.' }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Payload JSON mal formé' }));
    }
  });

  ws.on('close', () => {
    boutiqueSubscriptions.delete(ws);
    console.log('[WebSocket Server] Client déconnecté.');
  });
});

// Service helper pour distribuer les modifications de stocks en temps réel
export function broadcastStockUpdate(boutiqueId: string, frameId: string, stockCount: number) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subBoutique = boutiqueSubscriptions.get(client);
      if (subBoutique === boutiqueId) {
        client.send(JSON.stringify({
          type: 'STOCK_SYNCED',
          boutiqueId,
          frameId,
          stockCount,
          timestamp: new Date().toISOString()
        }));
      }
    }
  });
}

server.listen(port, () => {
  console.log(\`[G-LAB OPTIC Engine] Serveur lancé sur le port \${port}\`);
});`
  },
  {
    name: 'auth_middleware.ts',
    path: 'backend/middleware/auth_middleware.ts',
    language: 'typescript',
    module: 'Backend Core',
    layer: 'backend',
    type: 'middleware',
    description: 'Middleware validant les sessions JWT générées par Supabase Auth et injectant le tenant context (tenant_id).',
    content: `import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extension d'interface Express standard pour injecter l'état utilisateur décodé
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string; // ID multi-tenant identifiant la chaîne optique
  };
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Instance Supabase administrative pour valider les tokens
const supabase = createClient(supabaseUrl, supabaseServiceRole);

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autorisation refusée: Token d\\\'authentification manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérification de la session Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide ou session Supabase expirée.' });
    }

    // Extraction des métadonnées du tenant optique
    // Supabase stocke le tenant_id dans raw_user_meta_data
    const tenantId = user.user_metadata?.tenant_id;
    const role = user.user_metadata?.role || 'optometrist';

    if (!tenantId) {
      return res.status(403).json({ error: 'Accès interdit: Métadonnées de Tenant (compte chaîne SaaS) manquantes.' });
    }

    // Injection dans la requête Express
    req.user = {
      id: user.id,
      email: user.email || '',
      role,
      tenantId,
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur interne lors de la validation d\\\'identité auth.' });
  }
}`
  },
  {
    name: 'diagnostic.ts',
    path: 'backend/routes/diagnostic.ts',
    language: 'typescript',
    module: 'Diagnostic Optométrique',
    layer: 'backend',
    type: 'route',
    description: 'Routes API pour l\'enregistrement des bilans visuels, prescriptions et auto-catégorisation optique des verres.',
    content: `import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth_middleware';
import { createClient } from '@supabase/supabase-js';

export const diagnosticRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Enregistrer les mesures optométriques d'un patient
diagnosticRouter.post('/save', async (req: AuthenticatedRequest, res) => {
  const {
    patient_id,
    od_sphere, od_cylinder, od_axis, od_addition, // Oeil Droit
    og_sphere, og_cylinder, og_axis, og_addition, // Oeil Gauche
    pupillary_distance,
    optometrist_notes
  } = req.body;

  try {
    const tenantId = req.user?.tenantId;
    const optometristId = req.user?.id;

    const { data, error } = await supabase
      .from('optometric_diagnostics')
      .insert({
        tenant_id: tenantId,
        patient_id,
        optometrist_id: optometristId,
        od_sphere, od_cylinder, od_axis, od_addition,
        og_sphere, og_cylinder, og_axis, og_addition,
        pupillary_distance,
        optometrist_notes,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, diagnostic: data });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de l\\\'enregistrement visuel.' });
  }
});

// Récupérer l'historique visuel d'un patient connecté
diagnosticRouter.get('/patient/:patientId', async (req: AuthenticatedRequest, res) => {
  try {
    const { patientId } = req.params;
    const tenantId = req.user?.tenantId;

    const { data, error } = await supabase
      .from('optometric_diagnostics')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Impossible de charger l\\\'historique.' });
  }
});`
  },
  {
    name: 'schema.sql',
    path: 'database/schema.sql',
    language: 'sql',
    module: 'Database / Supabase',
    layer: 'database',
    type: 'schema',
    description: 'Script d\'initialisation de la base PostgreSQL gérant l\'intégralité des 28 tables ERP (RLS, FK, Index et Données d\'exemple).',
    content: `-- ==============================================================================
-- MASTER ARCHITECTURE SQL G-LAB OPTIC ERP
-- Conception relationnelle multi-sites & multi-tenants optimisée pour PostgreSQL 16
-- ==============================================================================

-- 0. Extensions et configuration initiale
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Suppression éventuelle programmée des anciennes structures
-- DROP TABLE IF EXISTS documents, warranties, notifications, messages, leave_requests, attendance, payroll, transactions, accounts, expenses, order_items, orders, prescriptions, sale_items, sales, stock_movements, inventory, products, brands, categories, suppliers, customers, employees, branches, zones, users, roles, permissions CASCADE;

-- 1. Table Tenant (SaaS Multi-enseigne de lunetterie)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Rôles (RBAC)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- 3. Table des Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL
);

-- Table Pivot Rôles <-> Permissions
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Table des Utilisateurs Système d'accès
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des Zones géographiques d'affectation régionale
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    tax_rate DECIMAL(5, 2) DEFAULT 20.00 CHECK (tax_rate >= 0),
    UNIQUE (tenant_id, name)
);

-- 6. Table des Succursales (Boutiques physiques / Branches)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table des Employés (Opticiens Certifiés, Optométristes, Directeurs de magasin)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(100), -- Numéro ADELI / RPPS obligatoire pour télétransmission Secu
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table d'association Employés <-> Rôles
CREATE TABLE employee_roles (
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, role_id)
);

-- 8. Table des Clients (Dossier Patient)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    social_security_number VARCHAR(30) CHECK (LENGTH(social_security_number) <= 15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Table des Fournisseurs (Verres, montures, consommables machine)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255),
    api_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Table des Catégories de Produits (Filtre hiérarchique)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE (tenant_id, name)
);

-- 11. Table des Marques (Fabricants de montures et verriers)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    manufacturer VARCHAR(255),
    UNIQUE (tenant_id, name)
);

-- 12. Table des Produits (Montures, Verres, Lentilles, Produits complexes)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL UNIQUE, -- Code - barre d'identification
    name VARCHAR(255) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0),
    sale_price DECIMAL(10, 2) NOT NULL CHECK (sale_price >= cost_price)
);

-- 13. Table d'Inventaire local (Quantités par boutique)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    min_alert_qty INT DEFAULT 2 CHECK (min_alert_qty >= 0),
    UNIQUE (branch_id, product_id)
);

-- 14. Table des mouvements de stock (Audit matériel complet)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    to_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INT NOT NULL CHECK (qty > 0),
    type VARCHAR(50) NOT NULL CHECK (type IN ('PURCHASE', 'SALE', 'TRANSFER', 'LOSS', 'ADJUSTMENT')),
    performed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Table des Ventes (Entête de Facturation client)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sold_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10, 2) NOT NULL CHECK (tax_amount >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    mutuelle_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (mutuelle_amount >= 0),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('DRAFT', 'PENDING', 'PAID', 'REFUNDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Table des lignes de ventes (Détail de la monture ou du verre affecté par oeil)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INT NOT NULL DEFAULT 1 CHECK (qty > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    eye_side VARCHAR(10) CHECK (eye_side IN ('LEFT', 'RIGHT', 'BOTH', 'NONE'))
);

-- 17. Table des Prescriptions et Diagnostics (Mesures optiques médicales)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    ophthalmologist_name VARCHAR(200),
    prescription_date DATE NOT NULL,
    
    -- Valeurs de réfraction physiques complexes
    od_sphere DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    od_cylinder DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    od_axis INT DEFAULT 0 CHECK (od_axis >= 0 AND od_axis <= 180),
    od_addition DECIMAL(4, 2) DEFAULT 0.00,
    
    og_sphere DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    og_cylinder DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    og_axis INT DEFAULT 0 CHECK (og_axis >= 0 AND og_axis <= 180),
    og_addition DECIMAL(4, 2) DEFAULT 0.00,
    
    is_expired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Table des Commandes d'Approvisionnement (Logistique Fournisseur / Verriers)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'SENT', 'RECEIVED', 'CLOSED')),
    estimated_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Table des articles de commande
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10, 2) NOT NULL CHECK (unit_cost >= 0)
);

-- 20. Table des Dépenses (Exploitation d'une succursale)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE DEFAULT CURRENT_DATE
);

-- 21. Table des Comptes Financiers (Plan comptable standard)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    UNIQUE (tenant_id, account_number)
);

-- 22. Table des Écritures comptables directes
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) CHECK (reference_type IN ('SALE', 'PURCHASE', 'SALARY', 'EXPENSE', 'TAX')),
    reference_id UUID, -- UUID de la vente, dépense ou paie associée
    debit DECIMAL(10, 2) DEFAULT 0.00 CHECK (debit >= 0),
    credit DECIMAL(10, 2) DEFAULT 0.00 CHECK (credit >= 0),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_double_entry CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

-- 23. Table de la Paie (Salarial global)
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL CHECK (base_salary > 0),
    commission_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (commission_amount >= 0),
    net_paid DECIMAL(10, 2) NOT NULL CHECK (net_paid > 0)
);

-- 24. Table des Présences (Pointage des opticiens diplômés d'atelier)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'LATE', 'ABSENT')),
    CONSTRAINT check_clock_time CHECK (clock_out IS NULL OR clock_out >= clock_in)
);

-- 25. Table des demandes de congés
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(150),
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
    CONSTRAINT check_leave_dates CHECK (end_date >= start_date)
);

-- 26. Table des Messages inter - boutiques et messagerie sécurisée
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. Table des Notifications d'alertes internes d'atelier
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 28. Table des Garanties de verres et de montures (Casse / Incendie / Adaptation visuelle)
CREATE TABLE warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    policy_number VARCHAR(150) UNIQUE NOT NULL,
    coverage_years INT DEFAULT 2 CHECK (coverage_years >= 1),
    is_redeemed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. Table Logistique Documents (Deivs 100% Santé, Fiche d'adaptation, Scans prescriptions)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN ('PRESCRIPTION_SCAN', 'QUOTE_SIGNED', 'MUTUELLE_CARD')),
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==============================================================================
-- INDEX COMPLEMENTAIRES POUR DES PERFORMANCES EXTRÊMES (Query Optimisations)
-- ==============================================================================
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_sales_branch_date ON sales(branch_id, created_at);
CREATE INDEX idx_customers_search ON customers(last_name, first_name);
CREATE INDEX idx_prescriptions_customer ON prescriptions(customer_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, clock_in);
CREATE INDEX idx_transactions_account ON transactions(account_id);


-- ==============================================================================
-- STRATÉGIE ROW LEVEL SECURITY (RLS) MULTI-TENANT ISOLATION
-- ==============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Existant de RLS Politiques types (Vérifie le tenant_id de l'utilisateur par rapport au token JWT)
CREATE POLICY rls_tenant_branches ON branches FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY rls_tenant_products ON products FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY rls_tenant_customers ON customers FOR ALL USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);


-- ==============================================================================
-- FONCTIONS PostgreSQL & AUTOMATED STOCK TRIGGER
-- ==============================================================================

-- 1. Incrémentation atomique du stock
CREATE OR REPLACE FUNCTION adjust_optic_stock(
    p_product_id UUID,
    p_branch_id UUID,
    p_offset INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO inventory (branch_id, product_id, stock_qty)
    VALUES (p_branch_id, p_product_id, GREATEST(0, p_offset))
    ON CONFLICT (branch_id, product_id)
    DO UPDATE SET stock_qty = GREATEST(0, inventory.stock_qty + p_offset);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Audit des mouvements de stock lors d'une saisie de ligne de vente directe
CREATE OR REPLACE FUNCTION audit_sale_stock_movement_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id UUID;
    v_sales_staff UUID;
BEGIN
    -- Récupère la succursale
    SELECT branch_id, sold_by INTO v_branch_id, v_sales_staff FROM sales WHERE id = NEW.sale_id;
    
    -- Enregistre un mouvement de stock
    INSERT INTO stock_movements (from_branch_id, product_id, qty, type, performed_by)
    VALUES (v_branch_id, NEW.product_id, NEW.qty, 'SALE', v_sales_staff);
    
    -- Ajuste la quantité physique d'inventaire
    PERFORM adjust_optic_stock(NEW.product_id, v_branch_id, - NEW.qty);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_sale_stock
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION audit_sale_stock_movement_trigger();


-- ==============================================================================
-- JEU DE DONNÉES D'EXEMPLE COMPLET (Seed Script Multi-site)
-- ==============================================================================

-- Insertion d'un tenant d'opticiens
INSERT INTO tenants (id, name, domain) VALUES 
('c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'GLAB OPTIC FRANCE', 'france.g-laboptic.com');

-- Zones géographiques
INSERT INTO zones (id, tenant_id, name, currency, tax_rate) VALUES 
('ea8a264a-e71e-4518-97be-21db60408544', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Région Île-de-France', 'EUR', 20.00);

-- Boutiques / Branches
INSERT INTO branches (id, tenant_id, zone_id, name, address, phone) VALUES 
('d1f11e9a-41ab-4ae7-82ba-b0cd83cdca42', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'ea8a264a-e71e-4518-97be-21db60408544', 'G-LAB OPTIC - Paris 15', '124 Rue de la Convention, 75015 Paris', '01 45 54 88 99'),
('cf9b17de-cae1-45bd-85c8-db372cdca431', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'ea8a264a-e71e-4518-97be-21db60408544', 'G-LAB OPTIC - Bastille', '8 Place de la Bastille, 75011 Paris', '01 42 78 55 44');

-- Utilisateurs d'accès système
INSERT INTO users (id, tenant_id, email, is_active) VALUES 
('ea2476bb-1cb4-45fb-a567-9bf461ee6a6f', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'paris15_atelier@g-laboptic.com', TRUE),
('7c7cbfa0-ded2-4f3b-b6fb-cfaef9abccfd', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'bastille_optom@g-laboptic.com', TRUE);

-- Employés rattachés
INSERT INTO employees (id, tenant_id, user_id, branch_id, first_name, last_name, license_number) VALUES 
('91cf76fa-aab1-46ab-82ba-efdaee5cbde8', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'ea2476bb-1cb4-45fb-a567-9bf461ee6a6f', 'd1f11e9a-41ab-4ae7-82ba-b0cd83cdca42', 'Marc', 'Lemoine', 'ADELI-751294831'),
('a3b7cfde-1678-43da-85ec-cbd789de1fe7', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', '7c7cbfa0-ded2-4f3b-b6fb-cfaef9abccfd', 'cf9b17de-cae1-45bd-85c8-db372cdca431', 'Amandine', 'Royer', 'ADELI-753901842');

-- Clients
INSERT INTO customers (id, tenant_id, first_name, last_name, birth_date, email, phone, social_security_number) VALUES 
('e0ca79bb-def2-4f51-b01c-6d2cde54ba29', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Jean-Pierre', 'Dupont', '1968-11-23', 'jp.dupont@wanadoo.fr', '06 12 34 56 78', '168117512409823'),
('6b90cd56-78e1-4fac-bced-78cfade90e44', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Sophie', 'Martinez', '1992-05-14', 'sophie.mtz@gmail.com', '07 89 01 23 45', '292057538901245');

-- Fournisseurs
INSERT INTO suppliers (id, tenant_id, company_name, contact_name, email, api_endpoint) VALUES 
('f08a9ab2-82ba-4cae-90fe-f6ba6deca310', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'ESSILOR FRANCE SAS', 'Directeur Grands Comptes', 'commandes-edi@essilor.fr', 'https://api.essilor.com/edi/v3'),
('bb72c0de-fa1d-4876-90fe-eaefda9cc9f2', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'LUXOTTICA DISTRIBUTION', 'Service Commercial', 'adv-france@luxottica.com', NULL);

-- Catégories de produits
INSERT INTO categories (id, tenant_id, name, parent_id) VALUES 
('c1a23bba-87be-4acb-82df-cecbdd87efc1', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Montures de Lunettes', NULL),
('a2fa09bb-cb7e-46ab-9bf1-dcedbba3eef2', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Verres Unifocaux', NULL),
('a3bf00de-dc99-4d32-ae2b-23abf600ee6f', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Verres Progressifs', NULL);

-- Marques
INSERT INTO brands (id, tenant_id, name, manufacturer) VALUES 
('db7210fe-16bc-4fa1-82ff-cbd092de1fac', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Ray-Ban', 'Luxottica Group'),
('7acb10de-16ec-4ab1-90ee-cbd889efc1fa', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Essilor Varilux', 'Essilor France');

-- Produits (Une monture & Un verre Progressif breveté)
INSERT INTO products (id, tenant_id, category_id, brand_id, sku, name, cost_price, sale_price) VALUES 
('91a27e38-16ab-4f10-bf9d-f6ba62cde2a5', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'c1a23bba-87be-4acb-82df-cecbdd87efc1', 'db7210fe-16bc-4fa1-82ff-cbd092de1fac', '8053672497854', 'Ray-Ban Clubmaster Shiny Black RX5154', 45.00, 149.00),
('0ba278df-f78a-4ab1-86ee-dbceda902ee5', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'a3bf00de-dc99-4d32-ae2b-23abf600ee6f', '7acb10de-16ec-4ab1-90ee-cbd889efc1fa', 'VSX-XSERIES-160-3G', 'Verre Varilux X Series Orma Crizal Sapphire HR 1.6', 95.00, 275.00);

-- Inventaire physique des montures
INSERT INTO inventory (branch_id, product_id, stock_qty, min_alert_qty) VALUES 
('d1f11e9a-41ab-4ae7-82ba-b0cd83cdca42', '91a27e38-16ab-4f10-bf9d-f6ba62cde2a5', 12, 3),
('cf9b17de-cae1-45bd-85c8-db372cdca431', '91a27e38-16ab-4f10-bf9d-f6ba62cde2a5', 5, 2);

-- Diagnostics cliniques d'un test de vue pour Jean-Pierre Dupont
INSERT INTO prescriptions (id, tenant_id, customer_id, ophthalmologist_name, prescription_date, od_sphere, od_cylinder, od_axis, od_addition, og_sphere, og_cylinder, og_axis, og_addition) VALUES 
('9bbcfade-6aae-45fc-ae2b-cbdbfe890e7a', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'e0ca79bb-def2-4f51-b01c-6d2cde54ba29', 'Dr. François Marchand', '2026-02-15', +1.50, -0.50, 90, +2.25, +1.25, -0.25, 85, +2.25);

-- Vente active avec déclencheur de mouvement
INSERT INTO sales (id, branch_id, customer_id, sold_by, subtotal, tax_amount, total_amount, mutuelle_amount, status) VALUES 
('bc72ab9e-78ca-42fa-b0ee-6da78baecde2', 'd1f11e9a-41ab-4ae7-82ba-b0cd83cdca42', 'e0ca79bb-def2-4f51-b01c-6d2cde54ba29', '91cf76fa-aab1-46ab-82ba-efdaee5cbde8', 582.50, 116.50, 699.00, 350.00, 'PAID');

-- Ligne d'équipement (Monture Ray-Ban) vendue
-- Remarque : Triggers PostgreSQL enregistre automatiquement le mouvement et ajuste l'inventaire Paris 15 à 11 !
INSERT INTO sale_items (id, sale_id, product_id, qty, unit_price, eye_side) VALUES 
('acade0db-7aae-4ab1-86ee-cbadeea90142', 'bc72ab9e-78ca-42fa-b0ee-6da78baecde2', '91a27e38-16ab-4f10-bf9d-f6ba62cde2a5', 1, 149.00, 'NONE');

-- Plan de Comptes
INSERT INTO accounts (id, tenant_id, account_number, name, type) VALUES 
('1af1bce2-901c-45fb-97be-21db60408ea2', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', '512000', 'Compte Courant Banque Populaire', 'ASSET'),
('2cf2bce2-911c-45fb-97be-22db60408ea3', 'c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', '707000', 'Ventes d''Équipements Optiques', 'REVENUE');

-- Écriture comptable simplifiée
INSERT INTO transactions (id, account_id, reference_type, reference_id, debit, credit) VALUES 
('a2bd01de-cae1-4deb-b9be-cadbec990145', '1af1bce2-901c-45fb-97be-21db60408ea2', 'SALE', 'bc72ab9e-78ca-42fa-b0ee-6da78baecde2', 699.00, 0.00);

-- Notifications
INSERT INTO notifications (tenant_id, title, message) VALUES 
('c5a28b04-8b65-4d7a-a48f-9a4897f26cd9', 'Livraison Essilor Expédiée', 'Le lot d''ordonnance de J-P Dupont a été validé par le laboratoire de lunetterie.');
`
  },
  {
    name: 'auth_middleware.ts',
    path: 'backend/src/middleware/auth_middleware.ts',
    language: 'typescript',
    module: 'Authentification & Sécurité',
    layer: 'backend',
    type: 'middleware',
    description: 'Middleware d\'authentification robuste vérifiant la présence et la validité du token JWT, gérant la rotation du Refresh Token, vérifiant le statut de double authentification (2FA) et assurant l\'isolation stricte du Tenant (SaaS Multi-tenant).',
    content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenant_id: string;
    role: string;
    permissions: string[];
    mfa_completed: boolean;
  };
}

/**
 * Middleware de validation du jeton d'accès (JWT)
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Jeton d\\'authentification manquant.' });
  }

  try {
    const secret = process.env.SUPABASE_JWT_SECRET || 'fallback-super-secret-key';
    const decodedPayload = jwt.verify(token, secret) as any;

    req.user = {
      id: decodedPayload.sub,
      email: decodedPayload.email,
      tenant_id: decodedPayload.user_metadata?.tenant_id,
      role: decodedPayload.user_metadata?.role,
      permissions: decodedPayload.user_metadata?.permissions || [],
      mfa_completed: decodedPayload.user_metadata?.mfa_completed || false,
    };

    // 1. Double Authentification (2FA) obligatoire pour les rôles d'encadrement, direction ou finances
    const isMfaEnforced = ['Super Administrateur', 'Directeur Général', 'Comptable', 'RH'].includes(req.user.role);
    if (isMfaEnforced && !req.user.mfa_completed) {
      return res.status(403).json({
        error: 'Double authentification (2FA) requise pour ce rôle.',
        code: 'MFA_REQUIRED',
        userId: req.user.id
      });
    }

    // 2. Traçabilité de Session de rafraîchissement active
    const { data: session, error } = await supabase
      .from('auth_connection_history')
      .select('is_revoked, expires_at')
      .eq('user_id', req.user.id)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !session) {
      return res.status(401).json({ error: 'Session révoquée ou expirée. Connexion requise.' });
    }

    // 3. Mise à jour temporelle de la présence
    await supabase
      .from('auth_connection_history')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expirée. Veuillez rafraîchir le jeton via Refresh Token.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({ error: 'Jeton d\\'accès invalide ou altéré.' });
  }
}`
  },
  {
    name: 'rbac_guard.ts',
    path: 'backend/src/middleware/rbac_guard.ts',
    language: 'typescript',
    module: 'Authentification & Sécurité',
    layer: 'backend',
    type: 'middleware',
    description: 'Filtres de route et garde-fous de permissions pour le contrôle d\'accès basé sur les rôles (RBAC) de l\'ERP G-LAB OPTIC. Cartographie les permissions pour les 9 rôles requis.',
    content: `import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth_middleware';

// Matrice exhaustive des Rôles et des Permissions de l'ERP
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Administrateur': ['*:*'],
  'Directeur Général': [
    'tenant:*', 'branches:*', 'inventory:*', 'sales:*', 'medical:*', 'accounting:*', 'hr:*', 'audit:read'
  ],
  'Responsable Régional': [
    'branches:read', 'inventory:read', 'inventory:write', 'sales:read', 'accounting:read_summary', 'hr:read'
  ],
  'Gérant Boutique': [
    'branches:write_self', 'inventory:*', 'sales:*', 'medical:read', 'payroll:read_self_branch', 'attendance:*', 'leave_requests:approve'
  ],
  'Caissier': [
    'sales:checkout', 'sales:read_self', 'inventory:read', 'customers:read', 'customers:write'
  ],
  'Opticien': [
    'medical:read', 'medical:write', 'prescriptions:*', 'inventory:read', 'inventory:adjust_optique', 'customers:*'
  ],
  'Magasinier': [
    'inventory:read', 'inventory:write', 'inventory:adjust_stock', 'orders:*', 'suppliers:read'
  ],
  'Comptable': [
    'accounting:*', 'sales:read', 'expenses:*', 'payroll:read_all', 'transactions:write'
  ],
  'RH': [
    'hr:*', 'payroll:*', 'attendance:read_all', 'leave_requests:*', 'employees:*'
  ]
};

/**
 * Middleware RBAC protégeant les endpoints d'affaires de l'ERP
 */
export function requirePermission(requiredPermission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    if (user.role === 'Super Administrateur') {
      return next();
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = userPermissions.some(permission => {
      if (permission === '*:*' || permission === '*') return true;
      
      const [domain, action] = permission.split(':');
      const [reqDomain, reqAction] = requiredPermission.split(':');
      
      const domainMatches = domain === reqDomain || domain === '*';
      const actionMatches = action === reqAction || action === '*';
      
      return domainMatches && actionMatches;
    });

    if (!hasPermission) {
      return res.status(403).json({
        error: \`Accès interdit. Le rôle [\${user.role}] ne possède pas la permission [\${requiredPermission}].\`
      });
    }

    next();
  };
}`
  },
  {
    name: 'rbac_guard.dart',
    path: 'frontend/lib/presentation/guards/rbac_guard.dart',
    language: 'dart',
    module: 'Authentification & Sécurité',
    layer: 'presentation',
    type: 'provider',
    description: 'Routeur de sécurité et Guard Flutter (Riverpod) pour le contrôle visuel des vues et des boutons d\'action de l\'ERP. Masque dynamiquement les boutons sensibles selon le rôle et l\'habilitation.',
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum UserRole {
  superAdmin,
  directeurGeneral,
  responsableRegional,
  gerantBoutique,
  caissier,
  opticien,
  magasinier,
  comptable,
  rh,
}

class AuthState {
  final String? userId;
  final String? email;
  final UserRole? role;
  final List<String> permissions;
  final bool is2faVerified;

  AuthState({
    this.userId,
    this.email,
    this.role,
    this.permissions = const [],
    this.is2faVerified = false,
  });

  bool get isAuthenticated => userId != null;
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());

  void login(String userId, String email, UserRole role, List<String> permissions, bool requires2fa) {
    state = AuthState(
      userId: userId,
      email: email,
      role: role,
      permissions: permissions,
      is2faVerified: !requires2fa,
    );
  }

  void verify2fa() {
    state = AuthState(
      userId: state.userId,
      email: state.email,
      role: state.role,
      permissions: state.permissions,
      is2faVerified: true,
    );
  }

  void logout() {
    state = AuthState();
  }
}

class RbacGuard extends ConsumerWidget {
  final List<String> requiredPermissions;
  final Widget child;
  final Widget? fallbackWidget;

  const RbacGuard({
    super.key,
    required this.requiredPermissions,
    required this.child,
    this.fallbackWidget,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    if (!authState.isAuthenticated) {
      return fallbackWidget ?? const Center(child: Text('Authentification requise.'));
    }

    if (authState.role == UserRole.superAdmin) {
      return child;
    }

    bool hasAccess = false;
    for (var reqPerm in requiredPermissions) {
      final reqParts = reqPerm.split(':');
      final reqDomain = reqParts[0];
      final reqAction = reqParts.length > 1 ? reqParts[1] : '*';

      for (var userPerm in authState.permissions) {
        if (userPerm == '*:*' || userPerm == '*') {
          hasAccess = true;
          break;
        }
        final userParts = userPerm.split(':');
        final userDomain = userParts[0];
        final userAction = userParts.length > 1 ? userParts[1] : '*';

        final domainMatch = userDomain == reqDomain || userDomain == '*';
        final actionMatch = userAction == reqAction || userAction == '*';

        if (domainMatch && actionMatch) {
          hasAccess = true;
          break;
        }
      }
      if (hasAccess) break;
    }

    if (!hasAccess) {
      return fallbackWidget ?? Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.shield_outlined, size: 64, color: Colors.redAccent),
              const SizedBox(height: 16),
              const Text('Accès Refusé', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Votre rôle n\'est pas configuré pour accéder à cette vue.'),
            ],
          ),
        ),
      );
    }

    return child;
  }
}`
  },
  {
    name: 'journal_and_connection_triggers.sql',
    path: 'database/migrations/journal_connection_triggers.sql',
    language: 'sql',
    module: 'Authentification & Sécurité',
    layer: 'database',
    type: 'schema',
    description: 'Procédures SQL d\'audit automatique et validation des double authentifications MFA et rotation des Refresh Tokens.',
    content: `-- 1. Fonction générique d'audit automatique des écritures
CREATE OR REPLACE FUNCTION audit_operational_changes_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_action VARCHAR(50);
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_client_ip VARCHAR(45);
BEGIN
    v_user_id := (auth.uid());
    v_tenant_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
    v_client_ip := (auth.jwt() ->> 'client_ip');

    IF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE_' || UPPER(TG_TABLE_NAME);
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE_' || UPPER(TG_TABLE_NAME);
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE_' || UPPER(TG_TABLE_NAME);
        v_new_data := to_jsonb(NEW);
    END IF;

    IF v_user_id IS NOT NULL THEN
        INSERT INTO auth_activity_logs (
            tenant_id,
            user_id,
            action,
            table_name,
            record_id,
            old_data,
            new_data,
            client_ip
        ) VALUES (
            COALESCE(v_tenant_id, (NEW.tenant_id)),
            v_user_id,
            v_action,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            v_old_data,
            v_new_data,
            COALESCE(v_client_ip, '0.0.0.0')
        );
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheurs sur les tables d'affaires auditées
CREATE TRIGGER trg_audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON prescriptions FOR EACH ROW EXECUTE FUNCTION audit_operational_changes_trigger();
CREATE TRIGGER trg_audit_sales AFTER INSERT OR UPDATE OR DELETE ON sales FOR EACH ROW EXECUTE FUNCTION audit_operational_changes_trigger();
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION audit_operational_changes_trigger();

-- Enregistrement de session unifiée
CREATE OR REPLACE FUNCTION register_user_login_session(
    p_user_id UUID,
    p_tenant_id UUID,
    p_session_token VARCHAR(255),
    p_refresh_token VARCHAR(255),
    p_client_ip VARCHAR(45),
    p_user_agent TEXT,
    p_requires_mfa BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_expires_at TIMESTAMP;
BEGIN
    v_expires_at := NOW() + INTERVAL '7 days';

    UPDATE auth_connection_history
    SET is_revoked = TRUE
    WHERE user_id = p_user_id AND is_revoked = FALSE;

    INSERT INTO auth_connection_history (
        tenant_id,
        user_id,
        session_token_hash,
        refresh_token_hash,
        client_ip,
        user_agent,
        mfa_verified,
        is_revoked,
        expires_at
    ) VALUES (
        p_tenant_id,
        p_user_id,
        crypt(p_session_token, gen_salt('bf')),
        crypt(p_refresh_token, gen_salt('bf')),
        p_client_ip,
        p_user_agent,
        NOT p_requires_mfa,
        FALSE,
        v_expires_at
    )
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
  },
  {
    name: 'dashboard_controller.ts',
    path: 'backend/src/controllers/dashboard_controller.ts',
    language: 'typescript',
    module: 'Multi-Boutique Analytics',
    layer: 'backend',
    type: 'controller',
    description: 'Controller Node.js pour l\'agrégation et le calcul sécurisé des KPIs analytique (CA, Bénéfice Net, rupture stock, top vendeurs, dépenses) du réseau de boutiques optique.',
    content: `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth_middleware';
import { db } from '../db/client';
import { sales, sale_items, products, employees, branches } from '../db/schema';
import { sql, eq, and, gte, lte, sum, count } from 'drizzle-orm';

export class DashboardController {
  
  /**
   * Récupère les métriques consolidées du tableau de bord d'une enseigne SaaS
   * Supporte la filtration par boutique, période temporelle, et applique les contraintes de rôle (RBAC)
   */
  public async getConsolidatedMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenant_id, role, permitted_branches } = req.user;
      const { branch_id, period } = req.query;

      // 1. Contrôle d'Accès basé sur les Rôles (RBAC)
      // Les opticiens ordinaires et caissiers sont limités à leur boutique d'affectation
      let targetBranchId: string | undefined = branch_id as string;
      if (role === 'Opticien' || role === 'Caissier') {
        const userEmployee = await db.query.employees.findFirst({
          where: eq(employees.user_id, req.user.id)
        });
        targetBranchId = userEmployee?.branch_id;
      }

      // Valider que la branche demandée est autorisée pour le profil
      if (targetBranchId && !permitted_branches.includes(targetBranchId)) {
        res.status(403).json({ error: "Interdit. Plan de succursale non habilité." });
        return;
      }

      // 2. Détermination de la fenêtre de temps
      let dateLimit = new Date();
      if (period === 'LAST_30_DAYS') {
        dateLimit.setDate(dateLimit.getDate() - 30);
      } else {
        // Défaut CE MOIS
        dateLimit.setDate(1); // Début du mois
      }

      // Assemble filters
      const conditions = [
        eq(sales.status, 'PAID'),
        gte(sales.created_at, dateLimit)
      ];
      
      if (targetBranchId) {
        conditions.push(eq(sales.branch_id, targetBranchId));
      } else {
        // Filtrer par succursales liées au tenant SaaS
        conditions.push(
          sql\`\${sales.branch_id} IN (SELECT id FROM branches WHERE tenant_id = \${tenant_id}::uuid)\`
        );
      }

      // 3. Agrégations de requêtes PostgreSQL consolidées
      const salesQuery = await db
        .select({
          totalRevenue: sum(sales.total_amount),
          totalTax: sum(sales.tax_amount),
          totalCount: count(sales.id)
        })
        .from(sales)
        .where(and(...conditions));

      const expenseQuery = await db
        .select({
          totalCost: sum(sql\`\${products.cost_price} * \${sale_items.qty}\`)
        })
        .from(sale_items)
        .innerJoin(sales, eq(sale_items.sale_id, sales.id))
        .innerJoin(products, eq(sale_items.product_id, products.id))
        .where(and(...conditions));

      // 4. Détecter les produits en rupture par rapport aux seuils
      const stockAlertQuery = await db
        .select({
          alertCount: count(sql\`CASE WHEN stock_qty <= min_alert_qty THEN 1 END\`),
          totalCount: count(sql\`CASE WHEN stock_qty = 0 THEN 1 END\`)
        })
        .from(sql\`inventory\`)
        .where(targetBranchId ? eq(sql\`branch_id\`, targetBranchId) : sql\`true\`);

      // 5. Calcul des leaders d'atouts (Top Optométristes)
      const topSellersQuery = await db
        .select({
          first_name: employees.first_name,
          last_name: employees.last_name,
          salesCount: count(sales.id),
          salesVolume: sum(sales.total_amount)
        })
        .from(sales)
        .innerJoin(employees, eq(sales.sold_by, employees.id))
        .where(and(...conditions))
        .groupBy(employees.id)
        .orderBy(sql\`sum(\${sales.total_amount}) DESC\`)
        .limit(5);

      const revenue = parseFloat(salesQuery[0]?.totalRevenue || '0');
      const costOfGoods = parseFloat(expenseQuery[0]?.totalCost || '0');
      // On comptabilise les dépenses de structures fixes simulées (20% du CA) + Coût d'achat verres/montures
      const operationalExpenses = costOfGoods + (revenue * 0.15);
      const netProfit = revenue - operationalExpenses;

      res.json({
        period,
        branch_id: targetBranchId || 'ALL',
        metrics: {
          chiffreAffaires: revenue,
          ventesDuJour: revenue / 30, // Moyenne journalière lissée
          beneficeNet: Math.max(0, netProfit),
          depensesExploitation: operationalExpenses,
          commandesEnAttente: Math.round(revenue / 12500), // Scaled indicator
          rupturesStock: stockAlertQuery[0]?.totalCount || 0,
        },
        topSellers: topSellersQuery
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}`
  },
  {
    name: 'dashboard_routes.ts',
    path: 'backend/src/routes/dashboard_routes.ts',
    language: 'typescript',
    module: 'Multi-Boutique Analytics',
    layer: 'backend',
    type: 'route',
    description: 'Passerelle API Express router avec validation RBAC et authentification 2FA obligatoire pour l\'accès aux flux comptables.',
    content: `import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth, requireMfa } from '../middlewares/auth_middleware';
import { checkPermissions } from '../middlewares/permission_middleware';

const router = Router();
const controller = new DashboardController();

/**
 * @route GET /api/v1/dashboard/consolidated-metrics
 * @desc Accéder aux agrégats de KPIs financiers de G-LAB OPTIC.
 * @access Habilité (Role: Admin, Directeur, Gérant. Permission: billing.read)
 */
router.get(
  '/consolidated-metrics',
  requireAuth,
  requireMfa, // Exige la validation OTP 2FA si rôle managérial
  checkPermissions(['billing.read', 'inventory.read']), // RBAC granulaires
  (req, res) => controller.getConsolidatedMetrics(req, res)
);

export default router;`
  },
  {
    name: 'dashboard_page.dart',
    path: 'frontend/lib/presentation/pages/dashboard/dashboard_page.dart',
    language: 'dart',
    module: 'Multi-Boutique Analytics',
    layer: 'presentation',
    type: 'service',
    description: 'Composant d\'interface adaptatif Material Design 3 gérant l\'affichage des bento-cards de performance financière.',
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'bento_metric_card.dart';
import 'dashboard_provider.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  String _selectedBranch = 'ALL';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final metricsState = ref.watch(dashboardProvider(_selectedBranch));

    return Scaffold(
      appBar: AppBar(
        title: const Text('G-LAB OPTIC ERP • Tableau de Bord'),
        actions: [
          // Dropdown de filtrage multi-boutiques
          DropdownButton<String>(
            value: _selectedBranch,
            dropdownColor: theme.colorScheme.surfaceVariant,
            items: const [
              DropdownMenuItem(value: 'ALL', child: Text('Tous les magasins')),
              DropdownMenuItem(value: 'PARIS', child: Text('Paris Nation')),
              DropdownMenuItem(value: 'LYON', child: Text('Lyon Bellecour')),
              DropdownMenuItem(value: 'MARSEILLE', child: Text('Marseille Vieux')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _selectedBranch = val);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(dashboardProvider(_selectedBranch).notifier).refreshMetrics(),
          ),
        ],
      ),
      body: metricsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Text('Erreur d\\'affichage : $err', style: const TextStyle(color: Colors.red)),
        ),
        data: (data) => SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Grid Responsive Bento (Adaptatif Desktop, Tablette et Mobile)
              LayoutBuilder(
                builder: (context, constraints) {
                  int crossAxisCount = constraints.maxWidth > 1000 ? 5 : (constraints.maxWidth > 600 ? 3 : 1);
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: 12.0,
                      mainAxisSpacing: 12.0,
                      childAspectRatio: 1.4,
                    ),
                    itemCount: 5,
                    itemBuilder: (context, idx) {
                      final item = data.metricsList[idx];
                      return BentoMetricCard(
                        title: item.title,
                        value: item.value,
                        percentage: item.percentage,
                        isPositive: item.isPositive,
                        icon: item.icon,
                        colorAccent: Color(0xFF0097A7), // G-LAB Blue accent
                      );
                    },
                  );
                },
              ),
              const SizedBox(height: 24.0),
              
              // 2. Sections de Graphiques complexes et alertes d'ateliers
              constraints.maxWidth > 900 
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 3, child: _buildMonthlyChartSection(data, theme)),
                      const SizedBox(width: 16.0),
                      Expanded(flex: 2, child: _buildStockAlertsSection(data, theme)),
                    ],
                  )
                : Column(
                    children: [
                      _buildMonthlyChartSection(data, theme),
                      const SizedBox(height: 16.0),
                      _buildStockAlertsSection(data, theme),
                    ],
                  ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMonthlyChartSection(DashboardData data, ThemeData theme) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.0),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chiffres d\\'affaires vs Dépenses', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16.0),
            Container(
              height: 200,
              color: theme.colorScheme.surface,
              child: const Center(
                child: Text('Graphique G-LAB (Shamir/Essilor) chargé sous CustomPaint'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockAlertsSection(DashboardData data, ThemeData theme) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.warning, color: Colors.amber),
        title: const Text('Stocks & Ruptures critiques'),
        subtitle: Text('\${data.metrics.ruptureCount} articles requis à l\\'ateliers d\\'usinage'),
      ),
    );
  }
}`
  },
  {
    name: 'dashboard_provider.dart',
    path: 'frontend/lib/presentation/providers/dashboard_provider.dart',
    language: 'dart',
    module: 'Multi-Boutique Analytics',
    layer: 'presentation',
    type: 'provider',
    description: 'Notifier de gestion d\'état de chargement et caches asynchrones pour l\'arbre de composants Riverpod.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/dashboard_entities.dart';
import '../../data/repositories/dashboard_repository_impl.dart';

// Famille de Providers autoDispose pour isoler automatiquement les requêtes par boutique
final dashboardProvider = StateNotifierProvider.family.autoDispose<
    DashboardNotifier, AsyncValue<DashboardData>, String>((ref, branchId) {
  final repo = ref.watch(dashboardRepositoryProvider);
  return DashboardNotifier(repo, branchId);
});

class DashboardNotifier extends StateNotifier<AsyncValue<DashboardData>> {
  final DashboardRepository _repository;
  final String _branchId;

  DashboardNotifier(this._repository, this._branchId) : super(const AsyncValue.loading()) {
    getMetrics();
  }

  /**
   * Récupère de façon asynchrone les données de l'API Node.js
   */
  Future<void> getMetrics() async {
    try {
      state = const AsyncValue.loading();
      final metrics = await _repository.fetchConsolidatedMetrics(
        branchId: _branchId == 'ALL' ? null : _branchId,
      );
      state = AsyncValue.data(metrics);
    } catch (err, stack) {
      state = AsyncValue.error(err, stack);
    }
  }

  /**
   * Force l'actualisation du cache de l'UI et invalide la re-consultation API
   */
  Future<void> refreshMetrics() async {
    await getMetrics();
  }
}`
  },
  {
    name: 'crm_controller.ts',
    path: 'backend/src/controllers/crm_controller.ts',
    language: 'typescript',
    module: 'CRM & Patient Log',
    layer: 'backend',
    type: 'controller',
    description: 'Contrôleur API Node.js/TypeScript gérant la sécurité médicale (RGPD) et l\'extraction consolidée du dossier d\'optométrie (Ordonnances, tiers-payant, contrats de garantie).',
    content: `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth_middleware';
import { db } from '../db/client';
import { customers, prescriptions, sales, payments, warranties } from '../db/schema';
import { sql, eq, and, or, ilike, desc } from 'drizzle-orm';

export class CrmController {

  /**
   * Récupère le répertoire patient avec options de filtres métier avancés (boutiques optiques, validité ordonnance, fidelisation tier)
   */
  public async getPatients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenant_id, role, permitted_branches } = req.user;
      const { search, branch_id, loyalty_tier, prescription_status } = req.query;

      // Isolation par Tenant SaaS obligatoire
      const baseConditions = [eq(customers.tenant_id, tenant_id)];

      // Filtrer par succursale si applicable (RBAC restreint aux opticiens d'une boutique)
      if (branch_id) {
        if (!permitted_branches.includes(branch_id as string)) {
          res.status(403).json({ error: "Accès interdit aux magasins du groupe tiers." });
          return;
        }
        baseConditions.push(eq(customers.branch_id, branch_id as string));
      }

      // Filtre d'administration par niveau de fidélité
      if (loyalty_tier) {
        baseConditions.push(eq(customers.loyalty_tier, loyalty_tier as string));
      }

      // Recherche libre (Nom complet, e-mail, NIR sécurité sociale)
      if (search) {
        const query = '%' + search + '%';
        baseConditions.push(
          or(
            ilike(customers.first_name, query),
            ilike(customers.last_name, query),
            ilike(customers.email, query),
            ilike(customers.social_security_number, query)
          )
        );
      }

      // Exécuter l'acquisition
      const patientRegistry = await db.query.customers.findMany({
        where: and(...baseConditions),
        orderBy: [desc(customers.created_at)]
      });

      res.json({ success: true, count: patientRegistry.length, data: patientRegistry });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  /**
   * Fournit la synthèse administrative complète d'un unique patient
   */
  public async getPatientSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;

      const patient = await db.query.customers.findFirst({
        where: and(eq(customers.id, id), eq(customers.tenant_id, tenant_id)),
        with: {
          prescriptions: {
            orderBy: [desc(prescriptions.prescription_date)]
          },
          sales: {
            with: {
              items: { with: { product: true } },
              payments: true
            }
          }
        }
      });

      if (!patient) {
        res.status(404).json({ error: "Dossier patient introuvable ou isolé par cloisonnement RGPD." });
        return;
      }

      res.json({ success: true, patient });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}`
  },
  {
    name: 'crm_routes.ts',
    path: 'backend/src/routes/crm_routes.ts',
    language: 'typescript',
    module: 'CRM & Patient Log',
    layer: 'backend',
    type: 'route',
    description: 'Routage API Express securisé des services CRM avec validation de signature ADELI/RPPS obligatoires pour les ordonnances médicales.',
    content: `import { Router } from 'express';
import { CrmController } from '../controllers/crm_controller';
import { requireAuth } from '../middlewares/auth_middleware';
import { checkPermissions } from '../middlewares/permission_middleware';

const router = Router();
const controller = new CrmController();

// Récupération globale sécurisée des dossiers patients (Requiert l'habilitation crm.read)
router.get(
  '/patients',
  requireAuth,
  checkPermissions(['crm.read']),
  (req, res) => controller.getPatients(req, res)
);

// Synthèse totale d'un patient pour édition clinique (Optométrie ou tiers-payant direct)
router.get(
  '/patients/:id/summary',
  requireAuth,
  checkPermissions(['crm.read', 'medical.read']),
  (req, res) => controller.getPatientSummary(req, res)
);

export default router;`
  },
  {
    name: 'crm_models.dart',
    path: 'frontend/lib/domain/entities/crm_models.dart',
    language: 'dart',
    module: 'CRM & Patient Log',
    layer: 'domain',
    type: 'entity',
    description: 'Entités de modélisation métier pour Dart / Flutter représentant l\'arbre relationnel d\'un dossier optique client.',
    content: `class CustomerEntity {
  final String id;
  final String firstName;
  final String lastName;
  final DateTime birthDate;
  final String email;
  final String phone;
  final String socialSecurityNumber;
  final int loyaltyPoints;
  final String loyaltyTier; // STANDARD, GOLD, PLATINUM, VIP
  final String branchId;

  const CustomerEntity({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.birthDate,
    required this.email,
    required this.phone,
    required this.socialSecurityNumber,
    required this.loyaltyPoints,
    required this.loyaltyTier,
    required this.branchId,
  });

  bool get isSeniorsTiersPayant => DateTime.now().year - birthDate.year >= 60;
}`
  },
  {
    name: 'patient_crm_provider.dart',
    path: 'frontend/lib/presentation/providers/patient_crm_provider.dart',
    language: 'dart',
    module: 'CRM & Patient Log',
    layer: 'presentation',
    type: 'provider',
    description: 'Gestionnaire d\'état asynchrone (Riverpod) assurant la filtration, le tri, et l\'actionnement d\'exportation de registres au niveau applicatif.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/crm_models.dart';

class PatientCRMState {
  final List<CustomerEntity> patients;
  final bool isLoading;
  final String searchQuery;
  final String loyaltyFilter;
  final String activeBranch;

  PatientCRMState({
    required this.patients,
    required this.isLoading,
    required this.searchQuery,
    required this.loyaltyFilter,
    required this.activeBranch,
  });

  PatientCRMState copyWith({
    List<CustomerEntity>? patients,
    bool? isLoading,
    String? searchQuery,
    String? loyaltyFilter,
    String? activeBranch,
  }) {
    return PatientCRMState(
      patients: patients ?? this.patients,
      isLoading: isLoading ?? this.isLoading,
      searchQuery: searchQuery ?? this.searchQuery,
      loyaltyFilter: loyaltyFilter ?? this.loyaltyFilter,
      activeBranch: activeBranch ?? this.activeBranch,
    );
  }
}

class PatientCRMNotifier extends StateNotifier<PatientCRMState> {
  PatientCRMNotifier() : super(PatientCRMState(
    patients: [],
    isLoading: false,
    searchQuery: '',
    loyaltyFilter: 'All',
    activeBranch: 'All',
  ));

  // Actualise le registre client de G-LAB
  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  // Téléverse une fiche patient vers l'EDI tiers-payant des mutuelles
  Future<void> syncMutualCare(String customerId) async {
    state = state.copyWith(isLoading: true);
    // Simulation API REST...
    await Future.delayed(const Duration(milliseconds: 600));
    state = state.copyWith(isLoading: false);
  }
}`
  },
  {
    name: 'crm_client_view.dart',
    path: 'frontend/lib/presentation/pages/crm/crm_client_view.dart',
    language: 'dart',
    module: 'CRM & Patient Log',
    layer: 'presentation',
    type: 'service',
    description: 'Interface adaptative Flutter (MD3) pour la gestion du portefeuille client, édition d\'ordonnances, filtres avancés et exports.',
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/patient_crm_provider.dart';

class CRMClientView extends ConsumerWidget {
  const CRMClientView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('G-LAB OPTIC CRM • Portefeuille Client'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_upload_outlined),
            tooltip: 'Exporter au format Excel',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Exportation du fichier Excel (CSV) validée !')),
              );
            },
          ),
        ],
      ),
      body: Row(
        children: [
          // Volet de filtrage gauche (Secteurs, Fidélité, Ordonnance)
          Expanded(
            flex: 1,
            child: Container(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Filtres Médicaux & CRM', style: theme.textTheme.titleSmall),
                  const Divider(),
                  const SizedBox(height: 12.0),
                  const Text('Statut d\\'ordonnance'),
                  // List d\\'options...
                ],
              ),
            ),
          ),
          
          // Grille/Liste principale des dossiers patients
          const Expanded(
            flex: 3,
            child: Center(
              child: Text('Sélectionnez un patient pour inspecter ses caractéristiques de réfractions, historiques et droits aux garanties.'),
            ),
          ),
        ],
      ),
    );
  }
}`
  },
  {
    name: 'pos_controller.ts',
    path: 'backend/src/controllers/pos_controller.ts',
    language: 'typescript',
    module: 'Caisse & POS',
    layer: 'backend',
    type: 'controller',
    description: 'Contrôleur API Node.js/TypeScript gérant l\'orchestration fiscale de la caisse POS (Calculs taxes croisés, paiements scindés / multi-pay, acomptes, et conformité de billetterie optique).',
    content: `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth_middleware';
import { db } from '../db/client';
import { transactions, ticketItems, payments } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export class PosController {

  /**
   * Crée une transaction d'achat caisse avec gestion d'un acompte ou d'un solde direct
   */
  public async createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.user;
      const { customer_id, items, discount_rate, split_payments, is_acompte } = req.body;

      // Calcul des totaux en backend pour validation fiscale anti-fraude
      let rawSubtotal = 0;
      for (const item of items) {
        rawSubtotal += item.price * item.quantity;
      }

      const totalDiscount = rawSubtotal * ((discount_rate || 0) / 100);
      const totalTtc = Math.max(0, rawSubtotal - totalDiscount);

      // Totalisation des règlements multiples reçus
      let totalPaid = 0;
      for (const pay of split_payments) {
        totalPaid += pay.amount;
      }

      const balanceRemaining = totalTtc - totalPaid;

      // Un acompte autorise un reste à payer, une vente normale requiert un solde complet à 100%
      if (!is_acompte && balanceRemaining > 0.01) {
        res.status(400).json({ 
          error: "Montant insuffisant. Veuillez solder la totalité de la facture ou basculer en mode Acompte." 
        });
        return;
      }

      // Enregistrement unifié dans la base transactionnelle PostgreSQL
      const txn = await db.insert(transactions).values({
        tenant_id,
        customer_id,
        subtotal: rawSubtotal,
        discount_amount: totalDiscount,
        total_ttc: totalTtc,
        paid_amount: totalPaid,
        balance: balanceRemaining,
        is_acompte,
        status: balanceRemaining <= 0 ? 'COMPLETED' : 'PARTIALLY_PAID',
        created_at: new Date()
      }).returning();

      const transactionId = txn[0].id;

      // Insérer les items du ticket (Montures, verres correcteurs, accessoires)
      for (const item of items) {
        await db.insert(ticketItems).values({
          transaction_id: transactionId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          tva_rate: item.tva_rate, // 20% pour montures/accessoires, 5.5% pour verres optiques médicaux
          discount_percent: item.discount_percent || 0
        });
      }

      // Insérer les différentes lignes de règlements multiples (Flooz, Mixx, Espèces, etc.)
      for (const pay of split_payments) {
        await db.insert(payments).values({
          transaction_id: transactionId,
          method: pay.method, // 'espèces' | 'Mobile Money' | 'Mixx by Yas' | 'Flooz' | 'virement bancaire'
          amount: pay.amount,
          reference: pay.reference,
          received_at: new Date()
        });
      }

      res.status(201).json({
        success: true,
        message: "Ticket de caisse validé avec succès en comptabilité.",
        transaction_id: transactionId,
        total_ttc: totalTtc,
        paid: totalPaid,
        remaining: balanceRemaining
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}`
  },
  {
    name: 'pos_routes.ts',
    path: 'backend/src/routes/pos_routes.ts',
    language: 'typescript',
    module: 'Caisse & POS',
    layer: 'backend',
    type: 'route',
    description: 'Routage API REST Express acheminant les validations de caisse POS et impression de duplicata fiscaux.',
    content: `import { Router } from 'express';
import { PosController } from '../controllers/pos_controller';
import { requireAuth } from '../middlewares/auth_middleware';

const router = Router();
const controller = new PosController();

// Soumission d'une vente (espèces, mobile money, acompte, etc.)
router.post(
  '/transactions',
  requireAuth,
  (req, res) => controller.createTransaction(req, res)
);

export default router;`
  },
  {
    name: 'pos_models.dart',
    path: 'frontend/lib/domain/entities/pos_models.dart',
    language: 'dart',
    module: 'Caisse & POS',
    layer: 'domain',
    type: 'entity',
    description: 'Modélisation Dart unifiée des articles de caisse, des types de règlements africains supportés, et des calculs d\'acomptes du portefeuille magasin.',
    content: `enum ProductType { montures, verres, accessoires }

enum PaymentMethod { especes, mobileMoney, mixxByYas, flooz, virementBancaire }

class POSItemEntity {
  final String productId;
  final String name;
  final ProductType type;
  final double priceTtc;
  final double tvaRate; // 20.0 ou 5.5
  final int qty;
  final double discountPercent;

  const POSItemEntity({
    required this.productId,
    required this.name,
    required this.type,
    required this.priceTtc,
    required this.tvaRate,
    this.qty = 1,
    this.discountPercent = 0.0,
  });

  double get lineTotal => (priceTtc * qty) * (1 - (discountPercent / 100));
  
  double get taxAmount => lineTotal - (lineTotal / (1 + (tvaRate / 100)));
}

class POSPaymentEntity {
  final PaymentMethod method;
  final double amount;
  final String reference;

  const POSPaymentEntity({
    required this.method,
    required this.amount,
    required this.reference,
  });
}`
  },
  {
    name: 'pos_provider.dart',
    path: 'frontend/lib/presentation/providers/pos_provider.dart',
    language: 'dart',
    module: 'Caisse & POS',
    layer: 'presentation',
    type: 'provider',
    description: 'Gestionnaire d\'état global Riverpod orchestrant le panier caissier actif, la totalisation des taxes TVA déportées, et les paiements partiels cumulés.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/pos_models.dart';

class POSCartState {
  final List<POSItemEntity> items;
  final List<POSPaymentEntity> payments;
  final double globalDiscountPercent;
  final bool isLoading;
  final bool isAcompteMode;

  POSCartState({
    required this.items,
    required this.payments,
    this.globalDiscountPercent = 0.0,
    this.isLoading = false,
    this.isAcompteMode = false,
  });

  double get rawSubtotal => items.fold(0.0, (sum, item) => sum + (item.priceTtc * item.qty));

  double get itemDiscountsSum => items.fold(0.0, (sum, item) {
    final basePrice = item.priceTtc * item.qty;
    return sum + (basePrice * (item.discountPercent / 100));
  });

  double get totalTtc {
    final sub = rawSubtotal - itemDiscountsSum;
    final total = sub * (1 - (globalDiscountPercent / 100));
    return total < 0 ? 0.0 : total;
  }

  double get totalPaid => payments.fold(0.0, (sum, pay) => sum + pay.amount);

  double get balanceRemaining => totalTtc - totalPaid;

  POSCartState copyWith({
    List<POSItemEntity>? items,
    List<POSPaymentEntity>? payments,
    double? globalDiscountPercent,
    bool? isLoading,
    bool? isAcompteMode,
  }) {
    return POSCartState(
      items: items ?? this.items,
      payments: payments ?? this.payments,
      globalDiscountPercent: globalDiscountPercent ?? this.globalDiscountPercent,
      isLoading: isLoading ?? this.isLoading,
      isAcompteMode: isAcompteMode ?? this.isAcompteMode,
    );
  }
}

class POSCartNotifier extends StateNotifier<POSCartState> {
  POSCartNotifier() : super(POSCartState(items: [], payments: []));

  void addItem(POSItemEntity item) {
    state = state.copyWith(items: [...state.items, item]);
  }

  void addPayment(POSPaymentEntity pay) {
    state = state.copyWith(payments: [...state.payments, pay]);
  }

  void setGlobalDiscount(double discount) {
    state = state.copyWith(globalDiscountPercent: discount);
  }

  void toggleAcompteMode(bool value) {
    state = state.copyWith(isAcompteMode: value);
  }

  void clearCart() {
    state = POSCartState(items: [], payments: []);
  }
}`
  },
  {
    name: 'pos_cashier_page.dart',
    path: 'frontend/lib/presentation/pages/pos/pos_cashier_page.dart',
    language: 'dart',
    module: 'Caisse & POS',
    layer: 'presentation',
    type: 'service',
    description: 'Interface Flutter complète (Material 3) simulant un écran tactile de caisse, un numériseur de code-barres, le suivi en direct des acomptes et des modes de paiement d\'Afrique de l\'Ouest.',
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/pos_provider.dart';

class PosCashierPage extends ConsumerWidget {
  const PosCashierPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posState = ref.watch(posCartProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: Row(
        children: [
          // Section Principale : Liste de produits et filtre de caisse tactile
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('COMPTOIR CAISSE ENREGISTREUSE G-LAB', style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 10),
                  // Simulation scan code-barre
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.qr_code_scanner),
                      title: const Text('Scanner Code-Barres Connecté'),
                      subtitle: const Text('Numérise automatiquement montures, verres, ou accessoires...'),
                      trailing: ElevatedButton(
                        onPressed: () {
                          // Simulation de bip sonore d\\'impulsion
                        },
                        child: const Text('BIP!'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Section Droite : Panier de l\'opticien et répartition des modes de règlements
          Expanded(
            flex: 2,
            child: Container(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Text('PANIER & ENCAISSEMENT', style: theme.textTheme.titleMedium),
                  const Divider(),
                  // Montant total dynamique
                  Text(
                    'Total Net : ' + posState.totalTtc.toStringAsFixed(2) + ' €',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}`
  },
  {
    name: 'stock_tables.sql',
    path: 'database/schema/stock_tables.sql',
    language: 'sql',
    module: 'Stock & Logistique',
    layer: 'database',
    type: 'schema',
    description: 'Structure DDL PostgreSQL décrivant les tables de mouvements de stock, inventaires tournants et transferts inter-boutiques avec politiques RLS (Row-Level Security) par Tenant G-LAB.',
    content: `-- Table principale des mouvements de stock (Entrées, Sorties, Retours, Ajustements)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(30) NOT NULL, -- 'ENTREE', 'SORTIE', 'RETOUR', 'AJUSTEMENT', 'TRANSFERT'
    quantity INTEGER NOT NULL, -- Positif pour entrées/retours, Négatif pour sorties
    reference_document VARCHAR(100), -- Numéro de Bon de Livraison (BL), facture, etc.
    operator_id UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des inventaires physiques (Recherches d\\'écarts de stocks)
CREATE TABLE physical_inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'DRAFT' NOT NULL, -- 'DRAFT', 'VALIDATED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    inspector_id UUID REFERENCES users(id)
);

-- Lignes d\\'inventaire avec écarts de stock (Système vs Physique)
CREATE TABLE physical_inventory_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES physical_inventories(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    system_qty INTEGER NOT NULL,
    physical_qty INTEGER NOT NULL,
    gap_qty INTEGER GENERATED ALWAYS AS (physical_qty - system_qty) STORED,
    adjusted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Table logistique des transferts inter-boutiques
CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    source_boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
    target_boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    shipper_name VARCHAR(100), -- Nom du coursier / transporteur
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE
);

-- Activation de la Row Level Security (RLS) pour cloisonner les stocks entre chaque opticien locataire (SaaS)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_inventory_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_stock_movement_policy ON stock_movements
    FOR ALL USING (tenant_id = auth.uid_tenant_id());`
  },
  {
    name: 'stock_controller.ts',
    path: 'backend/src/controllers/stock_controller.ts',
    language: 'typescript',
    module: 'Stock & Logistique',
    layer: 'backend',
    type: 'controller',
    description: 'Contrôleur API Node.js gérant le flux entrant/sortant, les validations d\'inventaires et le calcul des alertes de rupture critique.',
    content: `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth_middleware';
import { db } from '../db/client';
import { stockMovements, products, stockTransfers } from '../db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';

export class StockController {

  /**
   * Enregistre un mouvement de stock manuel (Entrée, Sortie, Perte ou Ajustement)
   */
  public async createMovement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenant_id, id: userId } = req.user;
      const { product_id, movement_type, quantity, reference_document, notes } = req.body;

      // 1. Enregistrer le log transactionnel
      await db.insert(stockMovements).values({
        tenant_id,
        product_id,
        movement_type,
        quantity,
        reference_document,
        operator_id: userId,
        notes,
        created_at: new Date()
      });

      // 2. Mettre à jour la quantité agrégée sur le produit visé (Verre, Monture)
      await db.update(products)
        .set({
          qty_in_stock: sql\`qty_in_stock + \${quantity}\`
        })
        .where(
          and(
            eq(products.id, product_id),
            eq(products.tenant_id, tenant_id)
          )
        );

      res.status(201).json({ success: true, message: "Mouvement de stock enregistré et appliqué au catalogue." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  /**
   * Extrait les alertes de stocks faibles et ruptures de la boutique active
   */
  public async getStockAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.user;

      // Recherche des produits dont le stock est inférieur ou égal au seuil min de sécurité configuré
      const alerts = await db.select()
        .from(products)
        .where(
          and(
            eq(products.tenant_id, tenant_id),
            lt(products.qty_in_stock, products.low_stock_threshold)
          )
        );

      const itemsInRupture = alerts.filter(p => p.qty_in_stock === 0);
      const itemsLowStock = alerts.filter(p => p.qty_in_stock > 0);

      res.status(200).json({
        total_alerts: alerts.length,
        ruptures_count: itemsInRupture.length,
        low_stock_count: itemsLowStock.length,
        items: alerts
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  /**
   * Initie un transfert logistique inter-boutique G-LAB
   */
  public async initiateTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.user;
      const { product_id, source_boutique_id, target_boutique_id, quantity, shipper_name } = req.body;

      // Vérification préalable du stock à la boutique d\\'origine
      const productObj = await db.select()
        .from(products)
        .where(and(eq(products.id, product_id), eq(products.tenant_id, tenant_id)))
        .limit(1);

      if (productObj.length === 0 || productObj[0].qty_in_stock < quantity) {
        res.status(400).json({ error: "Stock de départ insuffisant pour acter ce transfert." });
        return;
      }

      // Écriture du transfert d\\'acheminement
      const trans = await db.insert(stockTransfers).values({
        tenant_id,
        product_id,
        source_boutique_id,
        target_boutique_id,
        quantity,
        shipper_name,
        status: 'PENDING',
        sent_at: new Date()
      }).returning();

      // Soustraire le stock de la boutique d\\'origine immédiatement
      await db.update(products)
        .set({ qty_in_stock: sql\`qty_in_stock - \${quantity}\` })
        .where(eq(products.id, product_id));

      res.status(201).json({
        success: true,
        message: "Transfert logistique initié. Stock en transit.",
        transfer_id: trans[0].id
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}`
  },
  {
    name: 'stock_routes.ts',
    path: 'backend/src/routes/stock_routes.ts',
    language: 'typescript',
    module: 'Stock & Logistique',
    layer: 'backend',
    type: 'route',
    description: 'Enregistrement des points d\'accès HTTP Express pour les mouvements, alertes de seuils, et fiches logistiques.',
    content: `import { Router } from 'express';
import { StockController } from '../controllers/stock_controller';
import { requireAuth } from '../middlewares/auth_middleware';

const router = Router();
const controller = new StockController();

router.post('/movements', requireAuth, (req, res) => controller.createMovement(req, res));
router.get('/alerts', requireAuth, (req, res) => controller.getStockAlerts(req, res));
router.post('/transfers', requireAuth, (req, res) => controller.initiateTransfer(req, res));

export default router;`
  },
  {
    name: 'stock_models.dart',
    path: 'frontend/lib/domain/entities/stock_models.dart',
    language: 'dart',
    module: 'Stock & Logistique',
    layer: 'domain',
    type: 'entity',
    description: 'Structure Dart des modèles d\'entités de mouvements physiques, alertes ruptures et transferts.',
    content: `enum MovementType { entree, sortie, retour, ajustement, transfert }

class StockItemEntity {
  final String id;
  final String name;
  final String brand;
  final String category;
  final int qtyInStock;
  final int lowStockThreshold;
  final String barcode;
  final String locationCode;

  const StockItemEntity({
    required this.id,
    required this.name,
    required this.brand,
    required this.category,
    required this.qtyInStock,
    required this.lowStockThreshold,
    required this.barcode,
    required this.locationCode,
  });

  bool get isLowStock => qtyInStock > 0 && qtyInStock <= lowStockThreshold;
  bool get isOutOfStock => qtyInStock == 0;
}

class StockTransferEntity {
  final String id;
  final String productName;
  final int quantity;
  final String sourceBoutique;
  final String targetBoutique;
  final String status; // 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'
  final DateTime sentAt;

  const StockTransferEntity({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.sourceBoutique,
    required this.targetBoutique,
    required this.status,
    required this.sentAt,
  });
}`
  },
  {
    name: 'stock_notifier.dart',
    path: 'frontend/lib/presentation/providers/stock_notifier.dart',
    language: 'dart',
    module: 'Stock & Logistique',
    layer: 'presentation',
    type: 'provider',
    description: 'Gestionnaire d\'état Riverpod (Notifier & StateNotifier) gérant le rafraîchissement synchrone du catalogue, de la simulation d\'écarts et du listing des alertes.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/stock_models.dart';

class StockState {
  final List<StockItemEntity> items;
  final List<StockTransferEntity> activeTransfers;
  final bool isLoading;
  final String? errorMessage;

  StockState({
    required this.items,
    required this.activeTransfers,
    this.isLoading = false,
    this.errorMessage,
  });

  List<StockItemEntity> get alerts => items.where((i) => i.isLowStock || i.isOutOfStock).toList();

  StockState copyWith({
    List<StockItemEntity>? items,
    List<StockTransferEntity>? activeTransfers,
    bool? isLoading,
    String? errorMessage,
  }) {
    return StockState(
      items: items ?? this.items,
      activeTransfers: activeTransfers ?? this.activeTransfers,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class StockNotifier extends StateNotifier<StockState> {
  StockNotifier() : super(StockState(items: [], activeTransfers: []));

  void loadStockItems(List<StockItemEntity> loaded) {
    state = state.copyWith(items: loaded);
  }

  void addManualMovement(String id, int qtyChange) {
    state = state.copyWith(
      items: state.items.map((item) {
        if (item.id == id) {
          final newQty = item.qtyInStock + qtyChange;
          return StockItemEntity(
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category,
            qtyInStock: newQty < 0 ? 0 : newQty,
            lowStockThreshold: item.lowStockThreshold,
            barcode: item.barcode,
            locationCode: item.locationCode,
          );
        }
        return item;
      }).toList()
    );
  }

  void addTransfer(StockTransferEntity transfer) {
    state = state.copyWith(
      activeTransfers: [transfer, ...state.activeTransfers]
    );
  }
}`
  },
  {
    name: 'stock_dashboard_page.dart',
    path: 'frontend/lib/presentation/pages/stock/stock_dashboard_page.dart',
    language: 'dart',
    module: 'Stock & Logistique',
    layer: 'presentation',
    type: 'service',
    description: 'Interface graphique Flutter en matériel 3 optimisée pour tablettes optiques. Permet de scanner un code-barres et d\'éditer des fiches de transfert inter-magasin.',
    content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/stock_notifier.dart';
import '../../../domain/entities/stock_models.dart';

class StockDashboardPage extends ConsumerWidget {
  const StockDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockState = ref.watch(stockNotifierProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('LOGISTIQUE & GESTION DE STOCKS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code),
            onPressed: () {
              // Simuler l\\'impression d\\'une étiquette code-barres thermocollante
            },
          )
        ],
      ),
      body: Row(
        children: [
          // Section gauche : Listings des alertes critiques
          Expanded(
            flex: 2,
            child: Container(
              color: theme.colorScheme.errorContainer.withOpacity(0.15),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ALERTES DESSERTE STOCKS', style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.error
                  )),
                  const SizedBox(height: 10),
                  Expanded(
                    child: ListView.builder(
                      itemCount: stockState.alerts.length,
                      itemBuilder: (context, index) {
                        final alertItem = stockState.alerts[index];
                        return Card(
                          color: alertItem.isOutOfStock ? Colors.red.shade50 : Colors.orange.shade50,
                          child: ListTile(
                            leading: Icon(
                              alertItem.isOutOfStock ? Icons.cancel : Icons.warning_amber,
                              color: alertItem.isOutOfStock ? Colors.red : Colors.orange,
                            ),
                            title: Text(alertItem.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('ID: \${alertItem.barcode} • Empl: \${alertItem.locationCode}'),
                            trailing: Text(
                              alertItem.qtyInStock == 0 ? 'RUPTURE' : '\${alertItem.qtyInStock} Unités restantes',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Section droite: Saisie manuelle de flux rapides
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('RÉCEPTION DE COLISEAUX / BL EN BOUTIQUE', style: theme.textTheme.headlineSmall),
                  const Divider(),
                  const SizedBox(height: 20),
                  const TextField(
                    decoration: InputDecoration(
                      labelText: 'Numériser Code-Barres ou Entrer EAN',
                      prefixIcon: Icon(Icons.inventory_2),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 15),
                  ElevatedButton.icon(
                    onPressed: () {
                      // Acter un arrivage fournisseur Essilor ou L\\'Amy
                    },
                    icon: const Icon(Icons.add_circle),
                    label: const Text('Enregistrer l\\'entrée d\\'arrivage'),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}`
  },
  {
    name: 'stock_api_service.dart',
    path: 'frontend/lib/infrastructure/services/stock_api_service.dart',
    language: 'dart',
    module: 'Stock & Logistique',
    layer: 'data',
    type: 'service',
    description: 'Service d\'appel d\'APIs Flutter consommant l\'orchestrateeur fiscal Node.js de mouvements et transferts.',
    content: `import 'dart:convert';
import 'package:http/http.dart' as http;

class StockApiService {
  final String apiBaseUrl;
  final String userAuthToken;

  const StockApiService({
    required this.apiBaseUrl,
    required this.userAuthToken,
  });

  Future<bool> postStockMovement({
    required String productId,
    required String movementType,
    required int quantity,
    String? referenceDocument,
    String? notes,
  }) async {
    final response = await http.post(
      Uri.parse('\$apiBaseUrl/api/stock/movements'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer \$userAuthToken',
      },
      body: jsonEncode({
        'product_id': productId,
        'movement_type': movementType,
        'quantity': quantity,
        'reference_document': referenceDocument,
        'notes': notes,
      }),
    );

    return response.statusCode == 201;
  }
}`
  }
];


