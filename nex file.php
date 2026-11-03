<?php
// Tableau d'exemple (à remplacer par une vraie base de données plus tard)
$annonces = [
    ["id" => 1, "titre" => "Téléphone iPhone 13",     "description" => "En parfait état"],
    ["id" => 2, "titre" => "Télégramme de collection", "description" => "Objet vintage"],
    ["id" => 3, "titre" => "Télévision Samsung 4K",   "description" => "55 pouces"],
    ["id" => 4, "titre" => "PC Portable Dell",        "description" => "16 Go de RAM"]
];

// Récupération de l'action demandée
$action = $_GET['action'] ?? '';

// --- 1. RECHERCHE RAPIDE (QUICK MATCH) ---
if ($action === 'search') {
    header('Content-Type: application/json; charset=utf-8');
    $query = mb_strtolower(trim($_GET['q'] ?? ''), 'UTF-8');

    if ($query === '') {
        echo json_encode([]);
        exit;
    }

    // Filtrage des annonces dont le titre contient le texte recherché
    $resultats = array_filter($annonces, function ($annonce) use ($query) {
        return mb_strpos(mb_strtolower($annonce['titre'], 'UTF-8'), $query) !== false;
    });

    echo json_encode(array_values($resultats), JSON_UNESCAPED_UNICODE);
    exit;
}

// --- 2. AJOUT D'ANNONCE & NOTIFICATION E-MAIL ---
if ($action === 'add' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');

    // Nettoyage : on retire les retours à la ligne du titre (sécurité e-mail)
    $titre       = trim(str_replace(["\r", "\n"], ' ', $_POST['titre'] ?? ''));
    $description = trim($_POST['description'] ?? '');

    if ($titre !== '') {
        $nouvelleAnnonce = [
            "id"          => count($annonces) + 1,
            "titre"       => $titre,
            "description" => $description
        ];

        // Envoi de la notification par e-mail
        $destinataire = "destinataire@gmail.com";
        $sujet   = "Nouvelle annonce publiée : " . $titre;
        $message = "Une nouvelle annonce a été ajoutée !\n\nTitre : " . $titre . "\nDescription : " . $description;
        $headers = "From: votre_email@gmail.com\r\n" .
                   "Reply-To: votre_email@gmail.com\r\n" .
                   "MIME-Version: 1.0\r\n" .
                   "Content-Type: text/plain; charset=UTF-8\r\n" .
                   "X-Mailer: PHP/" . phpversion();

        $envoye = mail($destinataire, mb_encode_mimeheader($sujet, 'UTF-8'), $message, $headers);

        echo json_encode([
            "message" => $envoye
                ? "Annonce ajoutée et e-mail de notification envoyé avec succès !"
                : "Annonce ajoutée, mais l'e-mail n'a pas pu être envoyé.",
            "annonce" => $nouvelleAnnonce
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(400);
        echo json_encode(["erreur" => "Le titre est obligatoire."], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// Action inconnue
http_response_code(400);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(["erreur" => "Action invalide."], JSON_UNESCAPED_UNICODE);