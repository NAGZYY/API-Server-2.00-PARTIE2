// Jérémy Racine PFI 2023 - PARTIE 2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
$(document).ready(function () {
    let contentScrollPosition = 0;
    let currentETag = "";
    let filtreSelectionné = "date";
    let onListPhotos = "false";

    Init_UI();

    // Initial
    async function Init_UI() {
        try {
            let loggedUser = API.retrieveLoggedUser();

            if (loggedUser == null) {
                renderLogin();
            } else if (API.retrieveLoggedUser().VerifyCode != "unverified") {
                filtreSelectionné = "date";
                renderPhotos();
            } else if (API.retrieveLoggedUser().VerifyCode == "unverified") {
                renderVerification();
            }
        } catch (e) {
            console.log(e.message);
        }
    }

    function showWaitingGif() {
        eraseContent();
        $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
    }
    function eraseContent() {
        $("#content").empty();
    }
    function saveContentScrollPosition() {
        contentScrollPosition = $("#content")[0].scrollTop;
    }
    function restoreContentScrollPosition() {
        $("#content")[0].scrollTop = contentScrollPosition;
    }
    function getFormData($form) {
        const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
        var jsonObject = {};
        $.each($form.serializeArray(), (index, control) => {
            jsonObject[control.name] = control.value.replace(removeTag, "");
        });
        return jsonObject;
    }
    function logout() {
        API.logout().then(() => {
            renderLogin();
        });
    }
    function updateHeader(title, id) {
        let loggedUser = API.retrieveLoggedUser();

        $("#header").html(
            $(`
            <span title="Liste des photos" id="listPhotosCmd"> <img src="images/PhotoCloudLogo.png" class="appLogo"></span>
            <span class="viewTitle">`+ title
                + `<div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
            </span>
            <div class="headerMenusContainer"> <span>&nbsp;</span> <!--filler-->` +
                (loggedUser != null ? `
                <i title="Modifier votre profil">
                    <div class="UserAvatarSmall editProfilMenuCmd" userid="${loggedUser.Id}" style="background-image:url('${loggedUser.Avatar}')" title="${loggedUser.Name}"></div>
                </i>`: "") +
                `<div class="dropdown ms-auto dropdownLayout">
                <div data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                </div>
                <div class="dropdown-menu noselect" id="menu">
                </div>
            </div>
            </div>
        `));
        updateDropDownMenu();

        $('#newPhotoCmd').on("click", async function () { // Page d'ajout de photo
            renderAddPhoto();
        });
    }
    function updateDropDownMenu() {
        let loggedUser = API.retrieveLoggedUser();

        let menu = $("#menu");
        menu.empty();
        if (loggedUser == null) {
            menu.append($(`
            <span class="dropdown-item" id="loginCmd"><i class="menuIcon fa fa-sign-in mx-2"></i>Connexion</span>
        `));
        } else {
            if (loggedUser.Authorizations["readAccess"] == 2 && loggedUser.Authorizations["writeAccess"] == 2 && API.retrieveLoggedUser().VerifyCode != "unverified") {
                menu.append($(`
                    <span class="dropdown-item" id="manageUserCmd">
                        <i class="menuIcon fas fa-user-cog mx-2"></i>
                        Gestion des usagers
                    </span>
                `));

                menu.append($(`<div class="dropdown-divider"></div>`));
            }
            menu.append($(`
            <span class="dropdown-item" id="logoutCmd"><i class="menuIcon fa fa-sign-out mx-2"></i>Déconnexion</span>
        `));
        }
        if (loggedUser != null && API.retrieveLoggedUser().VerifyCode != "unverified") {
            menu.append($(`
            <span class="dropdown-item editProfilMenuCmd" userid="${loggedUser.Id}"><i class="menuIcon fa fa-user-edit mx-2"></i>Modifier votre profil</span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosMenuCmd">
                <i class="menuIcon fa fa-image mx-2"></i>Liste des photos
            </span>
        `));
            menu.append($(`<div class="dropdown-divider"></div> `));

            menu.append($(`
                <span class="dropdown-item" id="sortByDateCmd">
                <i class="menuIcon fa fa-check mx-2"></i>
                <i class="menuIcon fa fa-calendar mx-2"></i>
                Photos par date de création
            </span>
            <span class="dropdown-item" id="sortByOwnersCmd">
                <i class="menuIcon fa fa-fw mx-2"></i>
                <i class="menuIcon fa fa-users mx-2"></i>
                Photos par créateur
            </span>
            <span class="dropdown-item" id="sortByLikesCmd">
                <i class="menuIcon fa fa-fw mx-2"></i>
                <i class="menuIcon fa fa-heart mx-2"></i>
                Photos les plus aimées
            </span>
            <span class="dropdown-item" id="ownerOnlyCmd">
                <i class="menuIcon fa fa-fw mx-2"></i>
                <i class="menuIcon fa fa-user mx-2"></i>
                Mes photos
            </span>
        `));
        }

        $("#sortByDateCmd").click(() => {
            filtreSelectionné = "date";
            renderPhotos();
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#sortByDateCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        });
        if (filtreSelectionné == "date") {
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#sortByDateCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        }

        $("#sortByOwnersCmd").click(() => {
            filtreSelectionné = "owner";
            renderPhotos();
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#sortByOwnersCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        });
        if (filtreSelectionné == "owner") {
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#sortByOwnersCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        }

        $("#sortByLikesCmd").click(() => {
            filtreSelectionné = "likes";
            renderPhotos();
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#sortByLikesCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        });
        if (filtreSelectionné == "likes") {
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#sortByLikesCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        }

        $("#ownerOnlyCmd").click(() => {
            filtreSelectionné = "own";
            renderPhotos();
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#ownerOnlyCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        });
        if (filtreSelectionné == "own") {
            $(".fa-check").removeClass("menuIcon fa-check mx-2").addClass("menuIcon fa-fw mx-2");
            $("#ownerOnlyCmd .fa-fw").removeClass("menuIcon fa-fw mx-2").addClass("menuIcon fa-check mx-2");
        }

        menu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
        $('#aboutCmd').on("click", function () {
            renderAbout();
        });
        $('#manageUserCmd').on("click", async function () {
            saveContentScrollPosition();
            renderManageUser();
        });
        $('#loginCmd').on("click", async function () {
            saveContentScrollPosition();
            renderLogin();
        });
        $('#logoutCmd').on("click", async function () {
            logout();
        });
        $('.editProfilMenuCmd').on("click", async function () {
            if (API.retrieveLoggedUser().VerifyCode == "verified") {
                saveContentScrollPosition();
                renderEditProfil();
            }
        });
        $('#listPhotosCmd').on("click", async function () {
            saveContentScrollPosition();
            renderPhotos();
        });
        $('#listPhotosMenuCmd').on("click", async function () {
            //filtreSelectionné = "date";
            saveContentScrollPosition();
            renderPhotos();
        });
        $('#aboutCmd').on("click", function () {
            saveContentScrollPosition();
            renderAbout();
        });

    }

    // Option Admin
    async function renderManageUser() {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser != null) {
            if (loggedUser.Authorizations["readAccess"] != 2 || loggedUser.Authorizations["writeAccess"] != 2) {
                renderPhotos();
            }
        } else {
            renderLogin();
        }
        eraseContent();
        updateHeader("Gestion des usagers", "manageUser");
        $("#newPhotoCmd").hide();
        let accounts = await API.GetAccounts();
        if (accounts !== null) {
            accounts["data"].forEach(account => {
                if (account["Id"] != API.retrieveLoggedUser().Id)
                    $("#content").append(renderUser(account));
            });
            restoreContentScrollPosition();

            $(".deleteCmd").on("click", function () { // Surprimmer utilisateur
                saveContentScrollPosition();
                renderDelete(accounts["data"].find(user => user["Id"] == $(this).attr("deleteContactId")));
            });
            $(".addAdminCmd").on("click", function () { // Changé utilisateur pour admin
                saveContentScrollPosition();
                let profilToUpdate = accounts["data"].find(user => user["Id"] == $(this).attr("editContactId"));
                profilToUpdate.Authorizations["readAccess"] = 2;
                profilToUpdate.Authorizations["writeAccess"] = 2;
                profilToUpdate.Password = "";
                profilToUpdate.adminSender = API.retrieveLoggedUser().Id
                API.modifyUserAccessibility(profilToUpdate).then(() => {
                    renderManageUser();
                });
            });
            $(".removeAdminCmd").on("click", function () { // Changé utilisateur pour non admin
                saveContentScrollPosition();
                let profilToUpdate = accounts["data"].find(user => user["Id"] == $(this).attr("editContactId"));
                profilToUpdate.Authorizations["readAccess"] = 1;
                profilToUpdate.Authorizations["writeAccess"] = 1;
                profilToUpdate.Password = "";
                profilToUpdate.adminSender = API.retrieveLoggedUser().Id
                API.modifyUserAccessibility(profilToUpdate).then(() => {
                    renderManageUser();
                });
            });
            $(".addBlockedCmd").on("click", function () { // Changé utilisateur pour bloqué
                saveContentScrollPosition();
                let profilToUpdate = accounts["data"].find(user => user["Id"] == $(this).attr("editContactId"));

                profilToUpdate.isBlocked = true;
                profilToUpdate.Password = "";
                profilToUpdate.adminSender = API.retrieveLoggedUser().Id
                API.modifyUserAccessibility(profilToUpdate).then(() => {
                    renderManageUser();
                });
            });
            $(".removeBlockedCmd").on("click", function () { // Changé utilisateur pour non bloqué
                saveContentScrollPosition();
                let profilToUpdate = accounts["data"].find(user => user["Id"] == $(this).attr("editContactId"));
                profilToUpdate.isBlocked = false;
                profilToUpdate.Password = "";
                profilToUpdate.adminSender = API.retrieveLoggedUser().Id
                API.modifyUserAccessibility(profilToUpdate).then(() => {
                    renderManageUser();
                });
            });
            $(".contactRow").on("click", function (e) { e.preventDefault(); })

        } else {
            renderError("Service introuvable");
        }
    }

    // À propos
    function renderAbout() {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser != null) {
            timeout();
        }
        eraseContent();
        updateHeader("À propos...", "about");
        $("#newPhotoCmd").hide();
        $("#content").append(
            $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Fait à partir du code de base fourni par Nicolas Chourot
                </p>
                <p>
                    PFI Jérémy Racine 2023 PARTIE 2 :
                    <a href="https://github.com/NAGZYY/API-Server-2.00-PARTIE2">
                        Github
                    </a>
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `));
    }

    // Connexion
    function renderLogin(loginMessage = "", Email = "", EmailError = "", passwordError = "") {
        noTimeout();
        eraseContent();
        updateHeader("Connexion", "connect");
        $("#newPhotoCmd").hide();
        $("#content").append(
            $(`
        <div class="content" style="text-align:center">
            <h3>${loginMessage}</h3>
            <form class="form" id="loginForm">
                <input type='email'
                    name='Email'
                    class="form-control"
                    required
                    RequireMessage='Veuillez entrer votre courriel'
                    InvalidMessage='Courriel invalide'
                    placeholder="Adresse de courriel"
                    value='${Email}'>
                <span style='color:red'>${EmailError}</span>
                <input type='password'
                    name='Password'
                    placeholder='Mot de passe'
                    class="form-control"
                    required
                    RequireMessage='Veuillez entrer votre mot de passe'>
                <span style='color:red'>${passwordError}</span>
                <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
            </form>
            <div class="form">
                <hr> <button class="form-control btn-info" id="createAccountCmd">Nouveau compte</button>
            </div>
        </div>
        `));
        $('#createAccountCmd').on("click", async function () {
            renderCreateAccount();
        });

        initFormValidation();

        $('#loginForm').on("submit", function (event) {
            let profil = getFormData($('#loginForm'));

            event.preventDefault();

            API.eraseAccessToken();
            API.login(profil.Email, profil.Password).then(() => {
                switch (API.currentStatus) {
                    case 0:
                        let loggedUser = API.retrieveLoggedUser();
                        if (loggedUser.VerifyCode != "verified") {
                            renderVerification();
                        } else {
                            initTimeout(TimeOutExpireTime);
                            timeout();
                            renderPhotos();
                        }
                        break;
                    case 481:
                        renderLogin("", profil.Email, "Courriel introuvable");
                        break;
                    case 482:
                        renderLogin("", profil.Email, "", "Mot de passe incorrect");
                        break;
                    case 483:
                        renderLogin("Votre compte a été bloqué par l'administrateur", profil.Email);
                        break;
                    default:
                        renderError("Une erreur est survenue, veuillez rafraîchir et réessayer");
                        break;
                }
            });
        });
    }

    // Page de vérification
    function renderVerification(verificationError = "") {
        noTimeout();
        eraseContent();
        updateHeader("Vérification", "verify");
        $("#newPhotoCmd").hide();

        $("#content").append(
            $(`
        <div class="content" style="text-align:center">
            <h3>Veuillez entrer le code de vérification que vous avez reçu par courriel</h3>
            <form class="form" id="verifyProfilForm">
                <input type='text'
                    name='verificationCode'
                    class="form-control"
                    required
                    RequireMessage='Veuillez entrer votre code de vérification'
                    InvalidMessage='Code de vérification invalide'
                    placeholder="Code de vérification de courriel">
                <span style='color:red'>${verificationError}</span>
                <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
            </form>
        </div>
        `));

        initFormValidation();

        $('#verifyProfilForm').on("submit", function (event) {
            let form = getFormData($('#verifyProfilForm'));
            event.preventDefault();

            verifiedAccount(form)
        });
    }

    //  Vérifier le code
    async function verifiedAccount(form) {
        if (await API.verifyEmail(API.retrieveLoggedUser().Id, form.verificationCode)) {
            renderPhotos();
        } else {
            renderVerification(`Erreur, ${form.verificationCode} n'est pas le bon code`);
        }
    }

    //  Inscription
    function renderCreateAccount() {
        noTimeout();
        eraseContent(); // effacer le conteneur #content 

        restoreContentScrollPosition();

        updateHeader("Inscription", "createAccount");

        $("#newPhotoCmd").hide();
        $("#content").append(`
    <form class="form" id="createProfilForm">
        <fieldset>
            <legend>Adresse ce courriel</legend>
            <input type="email"
                class="form-control Email"
                name="Email"
                id="Email"
                placeholder="Courriel"
                required
                RequireMessage = ' Veuillez entrer votre courriel'
                InvalidMessage='Courriel invalide'
                CustomErrorMessage="Ce courriel est déjà utilisé" />
            <input class="form-control MatchedInput"
                type="text"
                matchedInputId="Email"
                name="matchedEmail"
                id="matchedEmail"
                placeholder="Vérification"
                required
                RequireMessage='Veuillez entrez de nouveau votre courriel'
                InvalidMessage="Les courriels ne correspondent pas" />
        </fieldset>
        <fieldset>
            <legend>Mot de passe</legend>
            <input type="password"
                class="form-control"
                name="Password"
                id="Password"
                placeholder="Mot de passe"
                required
                RequireMessage='Veuillez entrer un mot de passe'
                InvalidMessage='Mot de passe trop court' />
            <input class="form-control MatchedInput"
                type="password"
                matchedInputId="Password"
                name="matchedPassword"
                id="matchedPassword"
                placeholder="Vérification"
                required
                InvalidMessage="Ne correspond pas au mot de passe" />
        </fieldset>
        <fieldset>
            <legend>Nom</legend>
            <input type="text"
                class="form-control Alpha"
                name="Name"
                id="Name"
                placeholder="Nom"
                required
                RequireMessage='Veuillez entrer votre nom'
                InvalidMessage='Nom invalide' />
        </fieldset>
        <fieldset>
            <legend>Avatar</legend>
            <div class='imageUploader'
                newImage='true'
                controlId='Avatar'
                imageSrc='images/no-avatar.png'
                waitingImage="images/Loading_icon.gif">
            </div>
        </fieldset>
        <input type='submit'
            name='submit'
            id='saveUserCmd'
            value="Enregistrer"
            class="form-control btn-primary">
    </form>
    <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
    </div>
    `);
        initFormValidation();
        initImageUploaders();

        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser'); // Vérif 2 courriel

        $('#abortCmd').on("click", async function () { // Annuler -> Login
            renderLogin();
        });

        $('#createProfilForm').on("submit", function (event) {
            let profil = getFormData($('#createProfilForm'));
            delete profil.matchedPassword;
            delete profil.matchedEmail;
            if (!profil.Avatar) {
                profil.Avatar = "no-avatar.png";
            }
            event.preventDefault();

            showWaitingGif();
            API.register(profil);
            // Message vérif courriel
            renderLogin("Votre compte a été créé. Veuillez prendre vos courriels pour récupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion.");
        });
    }

    // Modifier profil
    function renderEditProfil() {
        let loggedUser = API.retrieveLoggedUser();
        noTimeout();
        eraseContent();
        updateHeader("Profil", "editProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(
            $(`
            <form class="form" id="editProfilForm">
                <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
                <fieldset>
                    <legend>Adresse ce courriel</legend>
                    <input type="email"
                        class="form-control Email"
                        name="Email"
                        id="Email"
                        placeholder="Courriel"
                        required
                        RequireMessage = ' Veuillez entrer votre courriel'
                        InvalidMessage='Courriel invalide'
                        CustomErrorMessage="Ce courriel est déjà utilisé"
                        value="${loggedUser.Email}">
                    <input class="form-control MatchedInput"
                        type="text"
                        matchedInputId="Email"
                        name="matchedEmail"
                        id="matchedEmail"
                        placeholder="Vérification"
                        required
                        RequireMessage='Veuillez entrez de nouveau votre courriel'
                        InvalidMessage="Les courriels ne correspondent pas"
                        value="${loggedUser.Email}">
                </fieldset>
                <fieldset>
                    <legend>Mot de passe</legend>
                    <input type="password"
                        class="form-control"
                        name="Password" id="Password"
                        placeholder="Mot de passe"
                        InvalidMessage='Mot de passe trop court'>
                    <input class="form-control MatchedInput"
                        type="password"
                        matchedInputId="Password"
                        name="matchedPassword"
                        id="matchedPassword"
                        placeholder="Vérification"
                        InvalidMessage="Ne correspond pas au mot de passe">
                </fieldset>
                <fieldset>
                    <legend>Nom</legend>
                    <input type="text"
                        class="form-control Alpha"
                        name="Name"
                        id="Name"
                        placeholder="Nom"
                        required
                        RequireMessage='Veuillez entrer votre nom'
                        InvalidMessage='Nom invalide'
                        value="${loggedUser.Name}">
                </fieldset>
                <fieldset>
                    <legend>Avatar</legend>
                    <div class='imageUploader'
                        newImage='false'
                        controlId='Avatar'
                        imageSrc='${loggedUser.Avatar}'
                        waitingImage="images/Loading_icon.gif">
                    </div>
                </fieldset>
                <input type='submit'
                    name='submit'
                    id='saveUserCmd'
                    value="Enregistrer"
                    class="form-control btn-primary">
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>
            <div class="cancel">
                <hr> <button class="form-control btn-warning" id="deleteCmd">Effacer le compte</button>
            </div>
        `));
        initFormValidation();
        initImageUploaders();

        $('#abortCmd').on("click", async function () { // Annuler -> Liste de photos
            renderPhotos();
        });
        $('#deleteCmd').on('click', async function () { // Supprimer compte
            renderDelete();
        });

        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');

        $('#editProfilForm').on("submit", function (event) {
            let profil = getFormData($('#editProfilForm'));
            delete profil.matchedPassword;
            delete profil.matchedEmail;
            event.preventDefault();
            showWaitingGif();
            API.modifyUserProfil(profil).then(() => {
                renderEditProfil();
            });
        });
    }

    // Confirmation de suppression de compte
    async function renderDelete(user = null) {
        if (API.retrieveLoggedUser() == null) {
            renderLogin();
        }

        noTimeout();
        eraseContent();
        updateHeader("Retrait de compte", "delete");
        $("#newPhotoCmd").hide();

        if (user == null) {
            $("#content").append(
                $(`
            <div class="content" style="text-align:center">
            <div class="form">
            <h3>Voulez-vous vraiment effacer votre compte?</h3>
            </div>
            <div class="form">
            <button class="form-control btn-danger" id="deleteCmd">Effacer mon compte</button>
            </div>
            <div class="cancel">
            <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>
            </div>
        `));
            $('#deleteCmd').on("click", async function () {
                API.unsubscribeAccount(API.retrieveLoggedUser().Id).then(() => {
                    noTimeout();
                    logout();
                });
            });
        } else {
            $("#content").append(
                $(`
                <div class="content" style="text-align:center">
                    <div class="form">
                    <h3>Voulez-vous vraiment effacer cet usager et toutes ces photos?</h3>
                </div>
                <div class="UserLayout" style="margin: auto; width: fit-content;">
                    <div class="UserAvatar" style="background-image:url('${user.Avatar}')"></div>
                    <div class="UserInfo">
                        <span class="UserName">${user.Name}</span>
                        <a href="mailto:${user.Email}" class="UserEmail" target="_blank" >${user.Email}</a>
                    </div>
                </div>
                <div class="form">
                <button class="form-control btn-danger" id="deleteCmd">Effacer</button>
                </div>
                <div class="cancel">
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
                </div>
                </div>
            `));
            $('#deleteCmd').on("click", async function () {
                API.unsubscribeAccount(user["Id"]);
                renderPhotos();
            });
        }
        $('#abortCmd').on("click", async function () { // Annuler -> liste des photos
            renderPhotos();
        });
    }

    // Erreur
    function renderError() {
        eraseContent();
        updateHeader("Erreur", "error");
        $("#newPhotoCmd").hide();
        $("#content").append(
            $(`
        <div class="content" style="text-align:center">
            <div class="form">
                <h3><span style='color:red'>Le serveur ne répond pas</span></h3>
            </div>
            <hr>
            <div class="form">
                <button class="form-control btn-primary" id="loginCmd">Essayez de vous reconnecter</button>
            </div>
        </div>
        `));
        $('#loginCmd').on("click", async function () {
            API.logout().then(() => {
                renderLogin();
            });
        });
    }

    // Liste des utilisateurs pour panel admin
    function renderUser(account) {
        let adminAccessButton;
        let userBlockButton;

        if (account.Authorizations["readAccess"] == 2 && account.Authorizations["writeAccess"] == 2) {
            adminAccessButton = `<span class="removeAdminCmd dodgerblueCmd fas fa-user-cog" editContactId="${account.Id}" title="Usager / promouvoir administrateur"></span>`;
        } else {
            adminAccessButton = `<span class="addAdminCmd dodgerblueCmd fas fa-user-alt" editContactId="${account.Id}" title="Administrateur / retirer les droits administrateur"></span>`;
        }

        if (account.isBlocked) {
            userBlockButton = `<span class="removeBlockedCmd redCmd fa fa-ban" editContactId="${account.Id}" title="Usager bloqué / débloquer l’accès"></span>`;
        } else {
            userBlockButton = `<span class="addBlockedCmd fa-regular fa-circle greenCmd" editContactId="${account.Id}" title="Usager non bloqué / bloquer l’accès"></span>`;
        }

        return $(`
        <div class="UserRow" contact_id=${account.Id}">
            <div class="UserContainer noselect">
                <div class="UserLayout">
                 <div class="UserAvatar" style="background-image:url('${account.Avatar}')"></div>
                 <div class="UserInfo">
                    <span class="UserName">${account.Name}</span>
                    <a href="mailto:${account.Email}" class="UserEmail" target="_blank" >${account.Email}</a>
                </div>
            </div>
            <div class="UserCommandPanel">` + adminAccessButton + userBlockButton +
            `<span class="deleteCmd goldenrodCmd fas fa-user-slash" deleteContactId="${account.Id}" title="Effacer ${account.Name}"></span>
            </div>
        </div>
    </div>
    `);
    }

    // =--------------------------------- PARTIE 2 ---------------------------------=
    // Liste des photos
    async function renderPhotos() {
        eraseContent();
        updateHeader("Liste des photos", "Photos");

        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser != null) {
            timeout();
        } else {
            return renderLogin();
        }

        onListPhotos = true;

        restoreContentScrollPosition();

        let allPhotos = await API.GetPhotos();

        if (API.error) {
            renderError();
        } else {
            // Crée une chaîne vide pour stocker le HTML des photos
            let photoRows = '';
            let nbrTours = 0;


            if (filtreSelectionné == "owner") { // Filtrer par créateur
                for (let photo of allPhotos["data"]) {
                    if (photo["Shared"] || photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                        try {
                            nbrTours++; // Permet d'afficher les photos qu'une seule fois

                            let photosByOwner = {};
                            for (let photo of allPhotos["data"]) {
                                if (!photosByOwner[photo.OwnerId]) {
                                    photosByOwner[photo.OwnerId] = [];
                                }
                                photosByOwner[photo.OwnerId].push(photo);
                            }

                            if (nbrTours == 2) {
                                return;
                            }

                            for (let ownerId in photosByOwner) {
                                let ownerPhotos = photosByOwner[ownerId];
                                
                                for (let i = 0; i < ownerPhotos.length; i++) {
                                    photo = ownerPhotos[i];
                                    if (photo["Shared"] || photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                                        let photoUser = (await API.GetAccountById(photo.OwnerId)).data;

                                        let dateUnix = photo.Date * 1000;
                                        let date = new Date(dateUnix);

                                        let joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                                        let moisAnnée = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

                                        let jour = joursSemaine[date.getDay()];
                                        let jourMois = date.getDate();
                                        let mois = moisAnnée[date.getMonth()];
                                        let année = date.getFullYear();
                                        let heures = date.getHours().toString().padStart(2, '0');
                                        let minutes = date.getMinutes().toString().padStart(2, '0');
                                        let secondes = date.getSeconds().toString().padStart(2, '0');

                                        let isUserLiked = false;
                                        isUserLiked = photo.LikedUsers.includes(loggedUser.Id);

                                        let likesSummary = "";

                                        if (photo.LikedUsers.length > 0) { // Si il y a des likes
                                            let likedUsers = await Promise.all(photo.LikedUsers.map(userId => API.GetAccountById(userId))); // Récupérer chaque user qui a liké
                                            let likedUsersList = likedUsers.map(user => user.data.Name).join('\n'); // Liste de chaque utilisateur avec saut à la ligne

                                            likesSummary = `<span class="likesSummary" title="${likedUsersList}">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                                        } else {
                                            likesSummary = `<span class="likesSummary">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                                        }

                                        photoRows += `
                                        <div class="photoLayout" style="display: inline-block;">
                                            <div class="photoTitleContainer">
                                                <span class="photoTitle detailsCmd" style="cursor: pointer" value="${photo.Id}">${photo.Title}</span>`;

                                        if (photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                                            photoRows += `<div class="cmdIcon2 fa fa-pencil editPhotoCmd" value="${photo.Id}" title="Éditer la photo"></div>
                                                      <div style="padding-left: 5px;" class="cmdIcon2 fa fa-trash deletePhotoCmd" value="${photo.Id}" title="Supprimer la photo"></div>`;
                                        }

                                        photoRows += `</div>
                                            <div class="photoLayout detailsCmd" style="cursor: pointer" value="${photo.Id}">
                                                <img src="${photo["Image"]}" class="photoImage" alt="Photo">
                                                <div class="UserAvatarPhoto" userid="${photo.OwnerId}" style="background-image:url('${photoUser.Avatar}')" title="${photoUser.Name}"></div>`;

                                        if (photo.Shared) {
                                            photoRows += `<div class="sharedImage" style="background-image:url('./images/shared.png')" title="Partagée"></div>`;
                                        }

                                        photoRows += `</div>
                                            <div class="photoCreationDate" style="display:flex">
                                                <span>${jour + ' le ' + jourMois + ' ' + mois + ' ' + année + ' @ ' + heures + ':' + minutes + ':' + secondes}</span>
                                                ${likesSummary}
                                            </div>
                                        </div>`;
                                    }
                                }
                            }
                            $("#content").append(photoRows);

                            $('.editPhotoCmd').on("click", async function () { // Modifier photo
                                let photoId = $(this).attr('value');
                                let photoToEdit = await API.GetPhotosById(photoId);
                                renderEditPhoto(photoToEdit);
                            });
                            $('.deletePhotoCmd').on("click", async function () { // Supprimer photo
                                let photoId = $(this).attr('value');
                                let photoToDelete = await API.GetPhotosById(photoId);
                                renderDeletePhoto(photoToDelete);
                            });
                            $('.detailsCmd').on("click", async function () { // Détails photo
                                let photoId = $(this).attr('value');
                                let photoToDetails = await API.GetPhotosById(photoId);
                                renderDetailsPhoto(photoToDetails);
                            });
                        } catch (error) {
                            console.error("Erreur lors de la récupération des photos :", error);
                        }
                    }
                }
            } else if (filtreSelectionné == "likes") { // Filtrer par likes (mentions j'aimes)
                allPhotos["data"].sort((a, b) => b.Likes - a.Likes); // Sort par nombre de likes (mentions j'aimes)
                for (let photo of allPhotos["data"]) {

                    if (photo["Shared"] || photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                        let photoUser = (await API.GetAccountById(photo.OwnerId)).data;

                        let dateUnix = photo.Date * 1000;
                        let date = new Date(dateUnix);

                        let joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                        let moisAnnée = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

                        let jour = joursSemaine[date.getDay()];
                        let jourMois = date.getDate();
                        let mois = moisAnnée[date.getMonth()];
                        let année = date.getFullYear();
                        let heures = date.getHours().toString().padStart(2, '0');
                        let minutes = date.getMinutes().toString().padStart(2, '0');
                        let secondes = date.getSeconds().toString().padStart(2, '0');

                        let isUserLiked = false;
                        isUserLiked = photo.LikedUsers.includes(loggedUser.Id);

                        let likesSummary = "";

                        if (photo.LikedUsers.length > 0) { // Si il y a des likes
                            let likedUsers = await Promise.all(photo.LikedUsers.map(userId => API.GetAccountById(userId))); // Récupérer chaque user qui a liké
                            let likedUsersList = likedUsers.map(user => user.data.Name).join('\n'); // Liste de chaque utilisateur avec saut à la ligne

                            likesSummary = `<span class="likesSummary" title="${likedUsersList}">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                        } else {
                            likesSummary = `<span class="likesSummary">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                        }

                        photoRows += `
                            <div class="photoLayout" style="display: inline-block;">
                                <div class="photoTitleContainer">
                                    <span class="photoTitle detailsCmd" style="cursor: pointer" value="${photo.Id}">${photo.Title}</span>`;

                        if (photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                            photoRows += `<div class="cmdIcon2 fa fa-pencil editPhotoCmd" value="${photo.Id}" title="Éditer la photo"></div>
                                          <div style="padding-left: 5px;" class="cmdIcon2 fa fa-trash deletePhotoCmd" value="${photo.Id}" title="Supprimer la photo"></div>`;
                        }

                        photoRows += `</div>
                                <div class="photoLayout detailsCmd" style="cursor: pointer" value="${photo.Id}">
                                    <img src="${photo["Image"]}" class="photoImage" alt="Photo">
                                    <div class="UserAvatarPhoto" userid="${photo.OwnerId}" style="background-image:url('${photoUser.Avatar}')" title="${photoUser.Name}"></div>`;

                        if (photo.Shared) {
                            photoRows += `<div class="sharedImage" style="background-image:url('./images/shared.png')" title="Partagée"></div>`;
                        }

                        photoRows += `</div>
                                <div class="photoCreationDate" style="display:flex">
                                    <span>${jour + ' le ' + jourMois + ' ' + mois + ' ' + année + ' @ ' + heures + ':' + minutes + ':' + secondes}</span>
                                    ${likesSummary}
                                </div>
                        
                                </div>`;
                    }
                }
            } else if (filtreSelectionné == "own") { // Filtrer par "mes photos"
                for (let photo of allPhotos["data"]) {
                    if (photo.OwnerId == loggedUser.Id) {
                        let photoUser = (await API.GetAccountById(photo.OwnerId)).data;

                        let dateUnix = photo.Date * 1000;
                        let date = new Date(dateUnix);

                        let joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                        let moisAnnée = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

                        let jour = joursSemaine[date.getDay()];
                        let jourMois = date.getDate();
                        let mois = moisAnnée[date.getMonth()];
                        let année = date.getFullYear();
                        let heures = date.getHours().toString().padStart(2, '0');
                        let minutes = date.getMinutes().toString().padStart(2, '0');
                        let secondes = date.getSeconds().toString().padStart(2, '0');

                        let isUserLiked = false;
                        isUserLiked = photo.LikedUsers.includes(loggedUser.Id);

                        let likesSummary = "";

                        if (photo.LikedUsers.length > 0) { // Si il y a des likes
                            let likedUsers = await Promise.all(photo.LikedUsers.map(userId => API.GetAccountById(userId))); // Récupérer chaque user qui a liké
                            let likedUsersList = likedUsers.map(user => user.data.Name).join('\n'); // Liste de chaque utilisateur avec saut à la ligne

                            likesSummary = `<span class="likesSummary" title="${likedUsersList}">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                        } else {
                            likesSummary = `<span class="likesSummary">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                        }

                        photoRows += `
                            <div class="photoLayout" style="display: inline-block;">
                                <div class="photoTitleContainer">
                                    <span class="photoTitle detailsCmd" style="cursor: pointer" value="${photo.Id}">${photo.Title}</span>`;

                        if (photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                            photoRows += `<div class="cmdIcon2 fa fa-pencil editPhotoCmd" value="${photo.Id}" title="Éditer la photo"></div>
                                        <div style="padding-left: 5px;" class="cmdIcon2 fa fa-trash deletePhotoCmd" value="${photo.Id}" title="Supprimer la photo"></div>`;
                        }

                        photoRows += `</div>
                                <div class="photoLayout detailsCmd" style="cursor: pointer" value="${photo.Id}">
                                    <img src="${photo["Image"]}" class="photoImage" alt="Photo">
                                    <div class="UserAvatarPhoto" userid="${photo.OwnerId}" style="background-image:url('${photoUser.Avatar}')" title="${photoUser.Name}"></div>`;

                        if (photo.Shared) {
                            photoRows += `<div class="sharedImage" style="background-image:url('./images/shared.png')" title="Partagée"></div>`;
                        }

                        photoRows += `</div>
                                <div class="photoCreationDate" style="display:flex">
                                    <span>${jour + ' le ' + jourMois + ' ' + mois + ' ' + année + ' @ ' + heures + ':' + minutes + ':' + secondes}</span>
                                    ${likesSummary}
                                </div>
                            </div>`;
                    }
                }
            } else { // Filtrer par date
                allPhotos["data"].sort((photo1, photo2) => { // Sort par date
                    const date1 = photo1.Date * 1000;
                    const date2 = photo2.Date * 1000;

                    if (date1 < date2) {
                        return date2 - date1;  // Trier de la plus récente à la plus ancienne
                    } else if (date1 > date2) {
                        return date2 - date1;
                    } else {
                        // Si les dates sont égales, conserver l'ordre d'origine
                        return 0;
                    }
                });
                for (let photo of allPhotos["data"]) {
                    if (photo["Shared"] || photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                        let photoUser = (await API.GetAccountById(photo.OwnerId)).data;

                        let dateUnix = photo.Date * 1000;
                        let date = new Date(dateUnix);

                        let joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                        let moisAnnée = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

                        let jour = joursSemaine[date.getDay()];
                        let jourMois = date.getDate();
                        let mois = moisAnnée[date.getMonth()];
                        let année = date.getFullYear();
                        let heures = date.getHours().toString().padStart(2, '0');
                        let minutes = date.getMinutes().toString().padStart(2, '0');
                        let secondes = date.getSeconds().toString().padStart(2, '0');

                        let isUserLiked = false;
                        isUserLiked = photo.LikedUsers.includes(loggedUser.Id);

                        let likesSummary = "";

                        if (photo.LikedUsers.length > 0) { // Si il y a des likes
                            let likedUsers = await Promise.all(photo.LikedUsers.map(userId => API.GetAccountById(userId))); // Récupérer chaque user qui a liké
                            let likedUsersList = likedUsers.map(user => user.data.Name).join('\n'); // Liste de chaque utilisateur avec saut à la ligne

                            likesSummary = `<span class="likesSummary" title="${likedUsersList}">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                        } else {
                            likesSummary = `<span class="likesSummary">${photo.Likes}<i class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i></span>`;
                        }

                        photoRows += `
                            <div class="photoLayout" style="display: inline-block;">
                                <div class="photoTitleContainer">
                                    <span class="photoTitle detailsCmd" style="cursor: pointer" value="${photo.Id}">${photo.Title}</span>`;

                        if (photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                            photoRows += `<div class="cmdIcon2 fa fa-pencil editPhotoCmd" value="${photo.Id}" title="Éditer la photo"></div>
                                          <div style="padding-left: 5px;" class="cmdIcon2 fa fa-trash deletePhotoCmd" value="${photo.Id}" title="Supprimer la photo"></div>`;
                        }

                        photoRows += `</div>
                                <div class="photoLayout detailsCmd" style="cursor: pointer" value="${photo.Id}">
                                    <img src="${photo["Image"]}" class="photoImage" alt="Photo">
                                    <div class="UserAvatarPhoto" userid="${photo.OwnerId}" style="background-image:url('${photoUser.Avatar}')" title="${photoUser.Name}"></div>`;

                        if (photo.Shared) {
                            photoRows += `<div class="sharedImage" style="background-image:url('./images/shared.png')" title="Partagée"></div>`;
                        }

                        photoRows += `</div>
                                <div class="photoCreationDate" style="display:flex">
                                    <span>${jour + ' le ' + jourMois + ' ' + mois + ' ' + année + ' @ ' + heures + ':' + minutes + ':' + secondes}</span>
                                    ${likesSummary}
                                </div>
                            </div>`;
                    }
                }
            }

            $("#content").append(photoRows);

            $('.editPhotoCmd').on("click", async function () { // Modifier photo
                let photoId = $(this).attr('value');
                let photoToEdit = await API.GetPhotosById(photoId);
                renderEditPhoto(photoToEdit);
            });
            $('.deletePhotoCmd').on("click", async function () { // Supprimer photo
                let photoId = $(this).attr('value');
                let photoToDelete = await API.GetPhotosById(photoId);
                renderDeletePhoto(photoToDelete);
            });
            $('.detailsCmd').on("click", async function () { // Détails photo
                let photoId = $(this).attr('value');
                let photoToDetails = await API.GetPhotosById(photoId);
                renderDetailsPhoto(photoToDetails);
            });
        }
    }

    // Ajouter une photo
    function renderAddPhoto() {
        noTimeout();
        eraseContent();
        updateHeader("Ajout de photos", "addPhoto");

        let loggedUser = API.retrieveLoggedUser();

        onListPhotos = false;

        $("#newPhotoCmd").hide();

        $("#content").append(`
            <br/>
            <form class="form" id="newPhotoForm"'>
                <input type="hidden" name="Likes" id="Likes" value="0"/>
                <input type="hidden" name="OwnerId" id="OwnerId" value="${loggedUser.Id}"/>
                <input type="hidden" name="Date" id="Date" value="${Math.floor(new Date().getTime() / 1000)}">
                <fieldset>
                    <legend>Informations</legend>
                    <input  type="text" 
                            class="form-control Alpha" 
                            name="Title" 
                            id="Title"
                            placeholder="Titre" 
                            required 
                            RequireMessage = 'Veuillez entrer un titre'
                            InvalidMessage = 'Titre invalide'/>

                    <textarea
                        class="form-control Alpha"
                        name="Description"
                        id="Description"
                        placeholder="Description"
                    ></textarea>

                    <input type="checkbox" name="Shared" id="Shared" />

                    <label for="Shared">Partagée</label>

                </fieldset>
                <fieldset>
                    <legend>Image</legend>
                    <div class='imageUploader' 
                        newImage='true' 
                        controlId='Image' 
                        imageSrc='images/PhotoCloudLogo.png'
                        required 
                        waitingImage="images/Loading_icon.gif">
                </div>
                </fieldset>
    
                <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>
        `);
        initFormValidation();
        initImageUploaders();

        $('#abortCmd').on("click", async function () { // Annuler -> Liste de photos
            renderPhotos();
        });

        $('#newPhotoForm').on("submit", function (event) { // Ajouter une photo avec tous ses informations
            let photo = getFormData($('#newPhotoForm'));
            photo['Shared'] = $('#Shared').is(':checked');
            photo['Likes'] = parseInt(photo['Likes']);
            photo['Date'] = parseInt(photo['Date'], 10);
            photo.LikedUsers = [];

            event.preventDefault();
            showWaitingGif();

            API.CreatePhoto(photo).then(() => { // Création de la photo
                renderPhotos();
            });
        });
    }

    // Editer une photo
    function renderEditPhoto(photo) {
        let result;
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.Id == photo.OwnerId || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
            noTimeout();
            eraseContent();
            updateHeader("Modification de photo", "editPhoto");

            onListPhotos = false;

            $("#newPhotoCmd").hide();

            let editPhoto = `
            <br/>
            <form class="form" id="editPhotoForm"'>
                <input type="hidden" name="Likes" id="Likes" value="${photo.Likes}"/>
                <input type="hidden" name="OwnerId" id="OwnerId" value="${photo.OwnerId}"/>
                <input type="hidden" name="Id" id="Id" value="${photo.Id}"/>
                <input type="hidden" name="Date" id="Date" value="${Math.floor(new Date().getTime() / 1000)}">
                <fieldset>
                    <legend>Informations</legend>
                    <input  type="text" 
                            class="form-control Alpha" 
                            name="Title" 
                            id="Title"
                            placeholder="Titre" 
                            value="${photo.Title}"
                            required 
                            RequireMessage = 'Veuillez entrer un titre'
                            InvalidMessage = 'Titre invalide'/>

                    <textarea
                        class="form-control Alpha"
                        name="Description"
                        id="Description"
                        placeholder="Description"
                    >${photo.Description}</textarea>

                    <input type="checkbox" name="Shared" id="Shared"`
            if (photo.Shared) {
                editPhoto = editPhoto + `checked />`;
            } else {
                editPhoto = editPhoto + ` />`;
            }
            editPhoto = editPhoto + `
                    <label for="Shared">Partagée</label>

                    </fieldset>
                    <fieldset>
                    <legend>Image</legend>
                    <div class='imageUploader'
                        newImage='false'
                        controlId='Image'
                        imageSrc='${photo.Image}'
                        waitingImage="images/Loading_icon.gif">
                    </div>
                    </fieldset>
        
                    <input type='submit' name='submit' id='saveImage' value="Enregistrer" class="form-control btn-primary">
                </form>
                <div class="cancel">
                    <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
                </div>
                `
                /*esult = API.UpdatePhoto(photo);
                if (result === null) {
                    currentETag = result.ETag;
                    renderPhotos();
                }
                else {
                    
                }*/

            $("#content").append(editPhoto);
            initFormValidation();
            initImageUploaders();

            $('#abortCmd').on("click", async function () { // Annuler -> Liste de photos
                renderPhotos();
            });

            $('#editPhotoForm').on("submit", function (event) { // Modifier la photo avec ses nouvelles informations
                let photo = getFormData($('#editPhotoForm'));
                photo['Shared'] = $('#Shared').is(':checked');
                photo['Likes'] = parseInt(photo['Likes']);
                photo['Date'] = parseInt(photo['Date'], 10);

                event.preventDefault();
                showWaitingGif();

                result = 
                API.UpdatePhoto(photo).then(() => { // Modifier la photo avec le nouveau nombre de likes
                    renderPhotos();
                });
            });
        }
    }

    // Supprimer une photo
    function renderDeletePhoto(photo) {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.Id == photo.OwnerId || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
            noTimeout();
            eraseContent();
            updateHeader("Retrait de photo", "deletePhoto");
            $("#newPhotoCmd").hide();

            $("#content").append(
                $(`
                <div class="content" style="text-align:center">
                    <div class="form">
                    <h3>Voulez-vous vraiment effacer cette photo?</h3>
                </div>
                <div class="UserLayout" style="margin: auto; width: fit-content;display:block">
                    <span class="photoTitle">${photo.Title}</span>
                    <div class="photoImage" style="background-image:url('${photo.Image}')"></div>
                </div>
                <div class="form">
                <button class="form-control btn-danger" id="deleteCmd">Effacer</button>
                </div>
                <div class="cancel">
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
                </div>
                </div>
            `));
            $('#deleteCmd').on("click", async function () { // Supprimer -> Liste des photos
                API.DeletePhoto(photo.Id);
                renderPhotos();
            });
            $('#abortCmd').on("click", async function () { // Annuler -> liste des photos
                renderPhotos();
            });
        }
    }

    // Détails photo
    async function renderDetailsPhoto(photo) {
        eraseContent();
        updateHeader("Détails", "details");
        $("#newPhotoCmd").hide();

        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser != null) {
            timeout();
        } else {
            return renderLogin();
        }

        onListPhotos = false;

        restoreContentScrollPosition();

        let photoRow = '';

        if (API.error) {
            renderError();
        } else {
            if (photo["Shared"] || photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {

                let photoUser = (await API.GetAccountById(photo.OwnerId)).data;

                let dateUnix = photo.Date * 1000;
                let date = new Date(dateUnix);

                let joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                let moisAnnée = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

                let jour = joursSemaine[date.getDay()];
                let jourMois = date.getDate();
                let mois = moisAnnée[date.getMonth()];
                let annee = date.getFullYear();
                let heures = date.getHours();
                let minutes = date.getMinutes();
                let secondes = date.getSeconds();

                let isUserLiked = false;
                isUserLiked = photo.LikedUsers.includes(loggedUser.Id);
                let likesSummary = "";

                if (photo.LikedUsers.length > 0) { // Si il y a des likes
                    let likedUsers = await Promise.all(photo.LikedUsers.map(userId => API.GetAccountById(userId))); // Récupérer chaque user qui a liké
                    let likedUsersList = likedUsers.map(user => user.data.Name).join('\n'); // Liste de chaque utilisateur avec saut à la ligne

                    likesSummary = `<span class="likesSummary" title="${likedUsersList}">${photo.Likes}<i style="cursor: pointer" class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up likeCmd"></i></span>`;
                } else {
                    likesSummary = `<span class="likesSummary">${photo.Likes}<i style="cursor: pointer" class="${isUserLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up likeCmd"></i></span>`;
                }

                photoRow = `
                    <div class="photoLayout">
                    <div style="display: flex">
                        <div class="UserAvatarSmallDetails" userid="${photo.OwnerId}" style="background-image:url('${photoUser.Avatar}')" title="${photoUser.Name}"></div>
                        <span style="color: black; font-weight: bold; text-align: center; display: inline-block; line-height: 4em;padding-left:0.3em"> ${photoUser.Name}</span>
                    </div>
                    <div class="dropdown-divider"></div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <div class="photoTitleContainer">
                            <span class="photoDetailsTitle">${photo.Title}</span>`
                if (photo.OwnerId == loggedUser.Id || loggedUser.Authorizations["readAccess"] == 2 || loggedUser.Authorizations["writeAccess"] == 2) {
                    photoRow = photoRow + `<div class="cmdIcon2 fa fa-pencil editPhotoCmd" style="font-size:1.6em" value="${photo.Id}" title="Éditer la photo"></div>
                                                <div style="padding-left: 5px; font-size: 1.6em" class="cmdIcon2 fa fa-trash deletePhotoCmd" value="${photo.Id}" title="Supprimer la photo"></div>`
                }
                photoRow = photoRow +
                    `</div>
                        <div class="photoLayout" style="display: flex; justify-content: center;">
                                <img src="${photo["Image"]}" class="photoDetailsLargeImage" alt="Photo">
                        </div>
                        <div class="photoDetailsCreationDate" style="display:flex">
                            <span>${jour + ' le ' + jourMois + ' ' + mois + ' ' + annee + ' @ ' + heures + ':' + minutes + ':' + secondes}</span>
                            ${likesSummary}
                        </div>
                        <p class="photoDetailsDescription">${photo.Description}</p>
                    </div>
                    </div>
                `;

                $("#content").append(photoRow);
            }
            $('.editPhotoCmd').on("click", async function () { // Modifier photo
                let photoId = $(this).attr('value');
                let photoToEdit = await API.GetPhotosById(photoId);
                renderEditPhoto(photoToEdit);
            });
            $('.deletePhotoCmd').on("click", async function () { // Supprimer photo
                let photoId = $(this).attr('value');
                let photoToDelete = await API.GetPhotosById(photoId);
                renderDeletePhoto(photoToDelete);
            });
            $('.likeCmd').on("click", async function (event) { // Mettre une mention j'aime
                if (loggedUser) {
                    // Vérifiez si l'utilisateur a déjà aimé la photo
                    const isUserLiked = photo.LikedUsers.includes(loggedUser.Id);

                    if (isUserLiked) { // Si l'utilisateur a déjà aimé
                        photo.Likes--;
                        const index = photo.LikedUsers.indexOf(loggedUser.Id);
                        if (index !== -1) {
                            photo.LikedUsers.splice(index, 1);
                        }
                    } else {// Si l'utilisateur n'a pas déjà aimé
                        photo.Likes++;
                        photo.LikedUsers.push(loggedUser.Id);
                    }

                    // Extraire le nom du fichier de l'URL
                    const urlSegments = photo.Image.split('/');
                    const urlImage = urlSegments[urlSegments.length - 1];
                    let oldUrlImage = photo.Image;

                    photo.Image = urlImage;

                    event.preventDefault();
                    showWaitingGif();

                    API.UpdatePhoto(photo).then(() => { // Modifier la photo avec le nouveau nombre de likes
                        photo.Image = oldUrlImage;
                        renderDetailsPhoto(photo);
                    });
                }
            });
        }
    }
    async function partialRefresh() { // Rafraichissement partiel
        result = await API.GetPhotosETag();
        if (result) {
            if (currentETag != result) {
                if (onListPhotos) {
                    renderPhotos();
                }
                currentETag = result;
            }
        }
    }

    setInterval(partialRefresh, 500); // Appelé à tout les 500 millisecondes
});