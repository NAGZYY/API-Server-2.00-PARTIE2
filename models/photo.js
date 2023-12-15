import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';

export default class Photo extends Model {
    constructor()
    {
        super();
        this.addField('OwnerId', 'string');
        this.addField('Title', 'string');        
        this.addField('Description', 'string');
        this.addField('Image', 'asset');
        this.addField('Date','integer');
        this.addField('Shared','boolean');
        this.addField('Likes','integer');
        //this.addField('LikedUsers', 'array');

        this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        let owner = usersRepository.get(instance.OwnerId);
        instance.OwnerName = owner.Name;
        instance.OwnerAvatar = owner.Avatar;

        // Initialisation de LikedUsers s'il n'est pas défini
        if (!instance.LikedUsers) {
            instance.LikedUsers = [];
        }

        return instance;
    }
}