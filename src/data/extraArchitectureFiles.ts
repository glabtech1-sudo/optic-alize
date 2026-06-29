import { ArchFile } from '../types/architecture';

export const extraArchFiles: ArchFile[] = [
  {
    name: 'appointment_entity.dart',
    path: 'frontend/lib/domain/entities/appointment_entity.dart',
    language: 'dart',
    module: 'Rendez-vous Clinique',
    layer: 'domain',
    type: 'entity',
    description: 'Entité métier représentant un rendez-vous planifié avec un opticien-optométriste.',
    content: `import 'package:equatable/equatable.dart';

class AppointmentEntity extends Equatable {
  final String id;
  final String patientName;
  final String date;
  final String time;
  final String reason; // Examen de la vue, Ajustement, Consultation
  final String opticianId;
  final String status; // Planifié, Présent, Annulé, Terminé

  const AppointmentEntity({
    required this.id,
    required this.patientName,
    required this.date,
    required this.time,
    required this.reason,
    required this.opticianId,
    required this.status,
  });

  AppointmentEntity copyWith({
    String? id,
    String? patientName,
    String? date,
    String? time,
    String? reason,
    String? opticianId,
    String? status,
  }) {
    return AppointmentEntity(
      id: id ?? this.id,
      patientName: patientName ?? this.patientName,
      date: date ?? this.date,
      time: time ?? this.time,
      reason: reason ?? this.reason,
      opticianId: opticianId ?? this.opticianId,
      status: status ?? this.status,
    );
  }

  @override
  List<Object?> get props => [id, patientName, date, time, reason, opticianId, status];
}`
  },
  {
    name: 'appointment_repository.dart',
    path: 'frontend/lib/domain/repositories/appointment_repository.dart',
    language: 'dart',
    module: 'Rendez-vous Clinique',
    layer: 'domain',
    type: 'repository',
    description: 'Interface du repository pour la création et le suivi des rendez-vous.',
    content: `import '../entities/appointment_entity.dart';

abstract class AppointmentRepository {
  Future<List<AppointmentEntity>> getAppointments();
  Future<AppointmentEntity> createAppointment(AppointmentEntity appointment);
  Future<void> updateAppointmentStatus(String id, String status);
}`
  },
  {
    name: 'appointment_notifier.dart',
    path: 'frontend/lib/presentation/providers/appointment_notifier.dart',
    language: 'dart',
    module: 'Rendez-vous Clinique',
    layer: 'presentation',
    type: 'provider',
    description: 'Riverpod StateNotifier pour la gestion réactive des rendez-vous de la clinique.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/appointment_entity.dart';

class ScheduledAppointmentsNotifier extends StateNotifier<List<AppointmentEntity>> {
  ScheduledAppointmentsNotifier() : super([
    const AppointmentEntity(
      id: 'RDV-101',
      patientName: 'Khadija Sy',
      date: '2026-06-10',
      time: '10:30',
      reason: 'Examen de la vue',
      opticianId: 'OPT-02',
      status: 'Planifié',
    ),
    const AppointmentEntity(
      id: 'RDV-102',
      patientName: 'Antoine Dubois',
      date: '2026-06-10',
      time: '14:15',
      reason: 'Ajustement monture',
      opticianId: 'OPT-01',
      status: 'Planifié',
    ),
    const AppointmentEntity(
      id: 'RDV-103',
      patientName: 'Saliou Diome',
      date: '2026-06-11',
      time: '09:00',
      reason: 'Bilan de contrôle',
      opticianId: 'OPT-02',
      status: 'Terminé',
    )
  ]);

  void addAppointment(AppointmentEntity appointment) {
    state = [...state, appointment];
  }

  void cancelAppointment(String id) {
    state = [
      for (final rdv in state)
        if (rdv.id == id) rdv.copyWith(status: 'Annulé') else rdv
    ];
  }

  void completeAppointment(String id) {
    state = [
      for (final rdv in state)
        if (rdv.id == id) rdv.copyWith(status: 'Terminé') else rdv
    ];
  }
}

final appointmentsProvider = StateNotifierProvider<ScheduledAppointmentsNotifier, List<AppointmentEntity>>((ref) {
  return ScheduledAppointmentsNotifier();
});`
  },
  {
    name: 'sight_exam_entity.dart',
    path: 'frontend/lib/domain/entities/sight_exam_entity.dart',
    language: 'dart',
    module: 'Examens de la Vue',
    layer: 'domain',
    type: 'entity',
    description: 'Entité métier stockant les réfractions physiques mesurées de l\'oeil droit et gauche.',
    content: `import 'package:equatable/equatable.dart';

class EyeRefraction extends Equatable {
  final double sphere;
  final double cylinder;
  final int axis;
  final double addition;

  const EyeRefraction({
    required this.sphere,
    required this.cylinder,
    required this.axis,
    required this.addition,
  });

  @override
  List<Object?> get props => [sphere, cylinder, axis, addition];
}

class SightExamEntity extends Equatable {
  final String id;
  final String patientId;
  final String date;
  final EyeRefraction rightEye;
  final EyeRefraction leftEye;
  final String pupillaryDistance;
  final String diagnosisNotes;

  const SightExamEntity({
    required this.id,
    required this.patientId,
    required this.date,
    required this.rightEye,
    required this.leftEye,
    required this.pupillaryDistance,
    required this.diagnosisNotes,
  });

  @override
  List<Object?> get props => [id, patientId, date, rightEye, leftEye, pupillaryDistance, diagnosisNotes];
}`
  },
  {
    name: 'sight_exam_notifier.dart',
    path: 'frontend/lib/presentation/providers/sight_exam_notifier.dart',
    language: 'dart',
    module: 'Examens de la Vue',
    layer: 'presentation',
    type: 'provider',
    description: 'Gère réactivement les états de fiches de prescription et tests d\'acuité Riverpod.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/sight_exam_entity.dart';

class SightExamHistoryNotifier extends StateNotifier<List<SightExamEntity>> {
  SightExamHistoryNotifier() : super([
    const SightExamEntity(
      id: 'EXAM-501',
      patientId: 'PAT-004',
      date: '2026-06-05',
      rightEye: EyeRefraction(sphere: -2.25, cylinder: -0.50, axis: 90, addition: 1.50),
      leftEye: EyeRefraction(sphere: -1.75, cylinder: -0.75, axis: 85, addition: 1.50),
      pupillaryDistance: '63.0',
      diagnosisNotes: 'Presbytie naissante et myopie légère. Verres progressifs recommandés.',
    )
  ]);

  void saveExam(SightExamEntity exam) {
    state = [exam, ...state];
  }
}

final sightExamProvider = StateNotifierProvider<SightExamHistoryNotifier, List<SightExamEntity>>((ref) {
  return SightExamHistoryNotifier();
});`
  },
  {
    name: 'sav_warranty_entity.dart',
    path: 'frontend/lib/domain/entities/sav_warranty_entity.dart',
    language: 'dart',
    module: 'SAV & Garanties',
    layer: 'domain',
    type: 'entity',
    description: 'Entité décrivant les dossiers S.A.V. de réparation ou d\'application de garanties.',
    content: `import 'package:equatable/equatable.dart';

class WarrantyEntity extends Equatable {
  final String serialNumber;
  final String purchaseDate;
  final int durationMonths;
  final String coverageType; // Scratch, Breakage, AllRisks

  const WarrantyEntity({
    required this.serialNumber,
    required this.purchaseDate,
    required this.durationMonths,
    required this.coverageType,
  });

  bool get isActive {
    final purchase = DateTime.parse(purchaseDate);
    final expiration = purchase.add(Duration(days: durationMonths * 30));
    return DateTime.now().isBefore(expiration);
  }

  @override
  List<Object?> get props => [serialNumber, purchaseDate, durationMonths, coverageType];
}

class SavClaimEntity extends Equatable {
  final String id;
  final String clientName;
  final String frameSku;
  final String issueDescription;
  final String warrantyStatus; // Sous Garantie, Hors Garantie
  final String claimStatus; // Reçu, En Atelier, Réparé, Remplacé, Livré
  final String dateCreated;

  const SavClaimEntity({
    required this.id,
    required this.clientName,
    required this.frameSku,
    required this.issueDescription,
    required this.warrantyStatus,
    required this.claimStatus,
    required this.dateCreated,
  });

  SavClaimEntity copyWith({
    String? id,
    String? clientName,
    String? frameSku,
    String? issueDescription,
    String? warrantyStatus,
    String? claimStatus,
    String? dateCreated,
  }) {
    return SavClaimEntity(
      id: id ?? this.id,
      clientName: clientName ?? this.clientName,
      frameSku: frameSku ?? this.frameSku,
      issueDescription: issueDescription ?? this.issueDescription,
      warrantyStatus: warrantyStatus ?? this.warrantyStatus,
      claimStatus: claimStatus ?? this.claimStatus,
      dateCreated: dateCreated ?? this.dateCreated,
    );
  }

  @override
  List<Object?> get props => [id, clientName, frameSku, issueDescription, warrantyStatus, claimStatus, dateCreated];
}`
  },
  {
    name: 'sav_warranty_notifier.dart',
    path: 'frontend/lib/presentation/providers/sav_warranty_notifier.dart',
    language: 'dart',
    module: 'SAV & Garanties',
    layer: 'presentation',
    type: 'provider',
    description: 'Riverpod StateNotifier contrôlant l\'atelier SAV et déclenchant la validation de garantie.',
    content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/sav_warranty_entity.dart';

class SavClaimsNotifier extends StateNotifier<List<SavClaimEntity>> {
  SavClaimsNotifier() : super([
    const SavClaimEntity(
      id: 'SAV-801',
      clientName: 'Marc Lefebvre',
      frameSku: 'OAK-HOLB-901',
      issueDescription: 'Charnière gauche désolidarisée',
      warrantyStatus: 'Sous Garantie',
      claimStatus: 'En Atelier',
      dateCreated: '2026-06-08',
    ),
    const SavClaimEntity(
      id: 'SAV-802',
      clientName: 'Amadou Mbacké',
      frameSku: 'RAY-WAYF-302',
      issueDescription: 'Rayure profonde verre droit',
      warrantyStatus: 'Hors Garantie',
      claimStatus: 'Reçu',
      dateCreated: '2026-06-09',
    )
  ]);

  void createClaim(SavClaimEntity claim) {
    state = [...state, claim];
  }

  void updateClaimStatus(String id, String status) {
    state = [
      for (final claim in state)
        if (claim.id == id) claim.copyWith(claimStatus: status) else claim
    ];
  }
}

final savClaimsProvider = StateNotifierProvider<SavClaimsNotifier, List<SavClaimEntity>>((ref) {
  return SavClaimsNotifier();
});`
  },
  {
    name: 'api_client.dart',
    path: 'frontend/lib/infrastructure/api/api_client.dart',
    language: 'dart',
    module: 'Réseau & Services Publics',
    layer: 'data',
    type: 'service',
    description: 'Client HTTP sécurisé gérant les en-têtes d\'API REST publiques, l\'isolation tenant et l\'adaptation hors-ligne.',
    content: `import 'dart:convert';
import 'package:http/http.dart' as http;

class RestApiClient {
  final String baseUrl;
  final String apiKey;
  final String tenantHeader;

  RestApiClient({
    required this.baseUrl,
    required this.apiKey,
    required this.tenantHeader,
  });

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http.get(
      Uri.parse('\$baseUrl\$path'),
      headers: {
        'Authorization': 'Bearer \$apiKey',
        'X-G-LAB-Tenant': tenantHeader,
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Erreur API REST (\${response.statusCode}): \${response.body}');
    }
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('\$baseUrl\$path'),
      headers: {
        'Authorization': 'Bearer \$apiKey',
        'X-G-LAB-Tenant': tenantHeader,
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode == 210 || response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('Erreur d\\'insertion API: \${response.body}');
    }
  }
}`
  },
  {
    name: 'push_notification_service.dart',
    path: 'frontend/lib/infrastructure/services/push_notification_service.dart',
    language: 'dart',
    module: 'Réseau & Services Publics',
    layer: 'data',
    type: 'service',
    description: 'Interface de gestion des notifications Firebase Cloud Messaging (FCM) et de synchronisation instantanée du personnel.',
    content: `class PushNotificationService {
  void initialize() {
    // Écouteur de notifications push en arrière-plan
    // FirebaseMessaging.onBackgroundMessage(_fcmBackgroundHandler);
  }

  Future<void> subscribeToTopic(String topic) async {
    // Abonner l\\'opticien aux alertes (ex: 'branch-paris', 'stock-alerts')
  }

  Future<void> sendPushNotification({
    required String targetToken,
    required String title,
    required String message,
  }) async {
    // Appel relais vers le microservice d\\'envoi de push
  }
}`
  }
];
