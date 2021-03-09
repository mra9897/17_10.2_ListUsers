const perPage = 6;
let page = 1;
let userData = [];
let cacheData;
let selectedUser = {};
let selectedImage = "";
const images = [
    "image1.png", "image2.png", "image3.png", "image4.png", "image5.png", "image6.png",
    "hat.jpg", "head.png", "idk.jpg", "mr-code.png", "spy.png", "walter.png"
];
$(function () {
    //fill our custom gallery with our images
    fillGallery();
    //requests to reqres server
    let userPage1 = $.get(`https://reqres.in/api/users?page=1`);
    let userPage2 = $.get(`https://reqres.in/api/users?page=2`);
    // join data and show theme after fetching data
    $.when(userPage1, userPage2).done(() => {
        userData.push(...userPage1.responseJSON.data, ...userPage2.responseJSON.data);
        //cached data to clone users by filter
        cacheData = userData;
        contentGenerator();
    });
    //'select' button to select image in our custom gallery
    $('#select').on("click", function () {
        //hide modal after select
        $('#galleryModal').modal('hide');
        // set action to detect update or create
        let action = $('#save').data("action");
        let avatar = $('#avatar');

        //if action is create config before and after image
        if (action === 'create') {
            avatar.parent().html($(`<img class="mt-1" src="${selectedImage}" id="avatar">`));
            avatar.on("click", function () {
                $('#galleryModal').modal('show')
            });
        } else if (action === 'update') $('#imgAfter').attr("src", selectedImage);
    });
    // save button
    $('#save').on("click", function () {
        if(!validateForm()) return false;
        let action = $(this).data("action");
        if (action === 'create') createUser();
        else if (action === 'update') updateUser();
        selectedImage = "";
        contentGenerator();
        $('#imgAfter').attr("src", "assets/images/no-image.png");
        $('#userForm').modal('hide');
    });
    $('#search').on("keyup", function () {
        let value = $(this).val();
        contentGenerator(value && value !== "" ? value : null);
    });
    $('#create').on("click", function () {
        $('#save').data("action", "create").text("Create");
        $('#userFormTitle').text("Create new user");
        $('#modalContent').html(modalUserForm());
        $('#imageControl').hide();
        toggleFooter("footerManage","footerShow");
        $('#userForm').modal('show');
    });
});
function contentGenerator(filter = null) {
    let body = $('#body');
    let search = $('#search');
    if(!filter && search.val()) filter = search.val();
    let filterRegex = RegExp(`\\w*${filter}\\w*`);
    cacheData =
        filter ?
            userData.filter(v => filterRegex.test(v.first_name) || filterRegex.test(v.last_name))
            :
            userData;
    // last id in current page
    let lastItem = perPage * page;
    let firstItem = lastItem - perPage;
    let dataCount = cacheData.length;
    let pageCount = Math.ceil(dataCount / perPage);
    if(!cacheData[firstItem] && page > 1) return changePage(page-1);
    pageButtons(pageCount);
    body.html('');
    //last id in current page {first page => 6 | second page => 12} - perPage {6} = first id in current page
    for (let i = firstItem; i < lastItem; i++) {
        let user = cacheData[i];
        if (!cacheData[i]) continue;
        body.append(`
            <div class="col-xs-12 col-sm-6 col-md-4">
                <div class="card bg-dark text-white mb-3">
                    <div class="imageProfile" style="background-image: url('${user.avatar}')"></div>
                        <span class="btn btn-danger position-absolute tr deleteUser" data-id="${user.id}" data-tool="tooltip" data-placement="top" title="Delete User">
                            <i class="fa fa-trash-alt"></i>
                        </span>
                        <span class="btn btn-warning position-absolute tl update" data-id="${user.id}" data-toggle="modal" data-target="#userForm" data-tool="tooltip" data-placement="top" title="Edit User">
                            <i class="fa fa-edit"></i>
                        </span>
                    <div class="card-body">
                        <h4 class="card-title">${user.id}.${user.first_name} ${user.last_name}</h4>
                        <p class="card-text"><b><i class="fa fa-envelope"></i> Email:</b> <a href="mailto:${user.email}">${user.email}</a></p>
                    </div>
                    <div class="card-footer flex border-light">
                        <span class="btn btn-primary btn-block showUser" data-id="${user.id}" data-toggle="modal" data-target="#userForm" data-tool="tooltip" data-placement="top" title="Show User">
                            <i class="fa fa-id-card"></i> Show profile
                        </span>
                    </div>
                </div>
            </div>
        `);
    }
    $('.update').on('click', function () {
        selectedUser = userData.find(v => v.id === $(this).data('id'));
        prepareToUpdate();
    });
    $('.showUser').on("click", function () {
        toggleFooter("footerShow","footerManage");
        selectedUser = userData.find(v => v.id === $(this).data("id"));
        $('#userFormTitle').text(selectedUser.first_name + " " + selectedUser.last_name);
        $('#modalContent').html(showModalForm());
        $('#updateCurrentUser').on("click", prepareToUpdate.bind(true));
        $('#deleteCurrentUser').on("click", deleteFunction);
    });
    $('.deleteUser').on("click", function () {
        console.log("data:::: "+$(this).data("id"));
        selectedUser = userData.find(v => v.id === $(this).data("id"));
        deleteFunction();
    })
    $('[data-tool="tooltip"]').tooltip();
}
function pageButtons(pageCount) {
    let pageHtml = $('#pagination');
    pageHtml.html('');
    for (let i = 1; i <= pageCount; i++)
        pageHtml.append(`<li class="page-item ${i === page ? "active" : ""}" data-page="${i}"><span class="page-link">${i}</span></li>`)
    $('.page-item').on("click", function (){changePage($(this).data("page"))});
}
const changePage = pageNumber => {
    $(`li[data-page=${page}]`).removeClass('active');
    page = pageNumber;
    $(`li[data-page=${page}]`).addClass('active');
    contentGenerator();
}
const fillGallery = () => {
    for (const image of images) {
        $('#gallery').append(`
        <div class="col-sm-4">
            <img src="assets/images/${image}" alt="image">
        </div>
        `);
    }
    $("#gallery img").on("click", function () {
        $('#gallery img').removeClass('selected-image');
        $(this).addClass('selected-image');
        selectedImage = $(this).attr("src");
    });
}
const modalUserForm = () => {
    return `
    <div class="row">
        <div class="col-sm-6">
            <label for="firstName">First Name:</label>
            <input type="text" id="firstName" class="form-control">
        </div>
        <div class="col-sm-6">
            <label for="LastName">Last Name:</label>
            <input type="text" id="lastName" class="form-control">
        </div>
        <div class="col-sm-6">
            <label for="email">Email:</label>
            <input type="email" id="email" class="form-control">
        </div>
        <div class="col-sm-6 choose-image">
            <label for="avatar">Avatar:</label>
            <button class="btn btn-primary form-control" data-toggle="modal" data-target="#galleryModal" id="avatar">Choose image...</button>
        </div>
    </div>
    <div class="row mt-3 p-1" id="imageControl">
        <div class="col-sm-5">
            <img src="" id="imgBefore" alt="">
        </div>
        <div class="col-sm-2 changeAvatar">
            <i class="fa fa-angle-double-right"></i>
        </div>
        <div class="col-sm-5">
            <label for="avatar">
                <img src="assets/images/no-image.png" id="imgAfter" alt="">
            </label>
        </div>
    </div>
    `;
}
const showModalForm = () => {
    return `
    <div class="row">
        <div class="col-sm-6">
            <img src="${selectedUser.avatar}" alt="${selectedUser.first_name} ${selectedUser.last_name}">
        </div>
        <div class="col-sm-6">
        <ul class="list-group text-dark">
            <li class="list-group-item">
                <b>Name: </b> ${selectedUser.first_name} ${selectedUser.last_name}
            </li>
            <li class="list-group-item">
                <b>Email: </b> ${selectedUser.email}
            </li>
        </ul>
        </div>
    </div>
    `;
}
const prepareToUpdate = (comeOnShowModal = false) => {
    $('#save').data('action', 'update').text("Save changes");
    $('#userFormTitle').text("Update " + selectedUser.first_name + " " + selectedUser.last_name);
    toggleFooter("footerManage","footerShow");
    let modalContent = $('#modalContent');
    if(comeOnShowModal){
        modalContent.fadeOut(200,function(){
            modalContent.html(modalUserForm());
            $('#firstName').val(selectedUser.first_name);
            $('#lastName').val(selectedUser.last_name);
            $('#email').val(selectedUser.email);
            $('#imgBefore').attr("src", selectedUser.avatar);
        });
        modalContent.fadeIn(200);
        return;
    }
    modalContent.html(modalUserForm());
    $('#firstName').val(selectedUser.first_name);
    $('#lastName').val(selectedUser.last_name);
    $('#email').val(selectedUser.email);
    $('#imgBefore').attr("src", selectedUser.avatar);

}
const updateUser = () => {
    selectedUser.first_name = $('#firstName').val();
    selectedUser.last_name = $('#lastName').val();
    selectedUser.email = $('#email').val();
    if (selectedImage) selectedUser.avatar = selectedImage;
    customAlert("warning", "User updated successfully :)");
}
const createUser = () => {
    let newUser = {
        //map returns id of all values and apply make it understandable for Math.max
        //because Math.max doesnt accept array
        //Math.max([1,3,2]) is wrong | Math.max(1,3,2) is correct
        //{cmnt copy nist, neveshtam yadam bemone k btonam tozih bedam}
        id: Math.max.apply(null, userData.map(v => v.id)) + 1,
        first_name: $('#firstName').val(),
        last_name: $('#lastName').val(),
        email: $('#email').val(),
        avatar: selectedImage
    }
    userData.unshift(newUser);
    customAlert("success", "User created successfully *-*");
}
const deleteFunction = () => {
    if (confirm(`Are you sure you want to delete user ${selectedUser.first_name} ${selectedUser.last_name}?`)) {
        userData.splice(userData.findIndex(v=>v.id === selectedUser.id), 1);
        contentGenerator();
        $('#userForm').modal('hide');
        $(".tooltip").tooltip("hide");
        customAlert("danger", "User deleted successfully x-x");
    }
}
const customAlert = (type, message) => {
    let htmlAlert = `<div class="alert alert-${type} alert-fix" role="alert">${message}</div>`;
    let grandPa = $('#grandPaAlert');
    grandPa.hide();
    grandPa.html(htmlAlert).fadeIn();
    setTimeout(() => grandPa.fadeOut(), 3000);
}
const validateForm = () => {
    let firstName = $('#firstName');
    let lastName = $('#lastName');
    let email = $('#email');
    if(
        !firstName.val() ||
        !lastName.val() ||
        !email.val()
    ) {
        customAlert("danger","all inputs should be fill bro! -_-");
        return false;
    }
    let emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(email.val()))  {
        customAlert("danger","email is not valid ;|");
        return false;
    }
    return true;
}
const toggleFooter = (show, hide) => {
    $(`#${show}`).show();
    $(`#${hide}`).hide();
}